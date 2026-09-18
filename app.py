from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from models import db, Game, Ball, Card
import random
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))

# If DATABASE_URL starts with postgres://, replace with postgresql:// for SQLAlchemy
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url or ('sqlite:///' + os.path.join(basedir, 'bingo.db'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'almacafebingo-secret-key-123' # Requerido para sesiones

db.init_app(app)

def get_letter_for_number(number):
    if 1 <= number <= 15: return 'B'
    elif 16 <= number <= 30: return 'I'
    elif 31 <= number <= 45: return 'N'
    elif 46 <= number <= 60: return 'G'
    elif 61 <= number <= 75: return 'O'
    return ''

@app.route('/', methods=['GET', 'POST'])
def login():
    error = request.args.get('error')
    if request.method == 'POST':
        card_id = request.form.get('card_id', '').strip().zfill(3)
        password = request.form.get('password', '').strip()
        
        # Validar admin
        if card_id.lower() == 'admin' and password == 'DARANOVA111':
            session['is_admin'] = True
            return redirect(url_for('screen'))
            
        # Validar jugador
        card = Card.query.get(card_id)
        print(f"Login attempt: ID={repr(card_id)} Pass={repr(password)} DB_Pass={repr(card.password) if card else 'NO CARD'}", flush=True)
        if card and card.password == password:
            session[f'auth_{card_id}'] = True
            return redirect(url_for('play', card_id=card_id))
            
        error = "ID o contraseña incorrectos"
        
    return render_template('login.html', error=error)

@app.route('/screen')
def screen():
    if not session.get('is_admin'):
        return redirect(url_for('login', error="Acceso denegado. Inicia sesión como admin."))
    return render_template('index.html')

@app.route('/play/<card_id>')
def play(card_id):
    if not session.get(f'auth_{card_id}'):
        return redirect(url_for('login', error="No autorizado para ver este cartón."))
        
    card = Card.query.get(card_id)
    if not card:
        return redirect(url_for('login', error="Cartón no encontrado"))
    return render_template('player.html', card_id=card_id, numbers=card.get_numbers())

@app.route('/api/game/new', methods=['POST'])
def new_game():
    active_games = Game.query.filter_by(active=True).all()
    for g in active_games:
        g.active = False
    
    game = Game(active=True)
    db.session.add(game)
    db.session.commit()
    
    return jsonify({"status": "success", "message": "New game started", "game_id": game.id})

@app.route('/api/game/draw', methods=['POST'])
def draw_ball():
    game = Game.query.filter_by(active=True).first()
    if not game:
        return jsonify({"status": "error", "message": "No active game"}), 400
        
    drawn_balls = [b.number for b in game.balls]
    available_numbers = [n for n in range(1, 76) if n not in drawn_balls]
    
    if not available_numbers:
        return jsonify({"status": "error", "message": "All balls drawn"}), 400
        
    number = random.choice(available_numbers)
    letter = get_letter_for_number(number)
    
    ball = Ball(game_id=game.id, letter=letter, number=number)
    db.session.add(ball)
    db.session.commit()
    
    return jsonify({"status": "success", "ball": {"letter": letter, "number": number}})

@app.route('/api/game/state', methods=['GET'])
def get_state():
    game = Game.query.filter_by(active=True).first()
    if not game:
        return jsonify({"status": "success", "balls": [], "active": False})
        
    balls = [{"letter": b.letter, "number": b.number} for b in game.balls]
    return jsonify({"status": "success", "balls": balls, "active": True})

@app.route('/api/game/validate', methods=['POST'])
def validate_card():
    data = request.get_json()
    card_id = data.get('card_id')
    
    if not card_id:
        return jsonify({"status": "error", "message": "Card ID required"}), 400
        
    card = Card.query.get(card_id)
    if not card:
        return jsonify({"status": "error", "message": "Card not found"}), 404
        
    game = Game.query.filter_by(active=True).first()
    if not game:
        return jsonify({"status": "error", "message": "No active game"}), 400
        
    drawn_balls = [b.number for b in game.balls]
    card_numbers = card.get_numbers()
    
    # Índices ignorando la posición 12 (LIBRE)
    d1_indices = [0, 6, 18, 24]
    d2_indices = [4, 8, 16, 20]
    x_indices = [0, 6, 18, 24, 4, 8, 16, 20]
    marco_indices = [0, 5, 10, 15, 20, 4, 9, 14, 19, 24, 1, 2, 3, 21, 22, 23]
    lleno_indices = [i for i in range(25) if i != 12]
    
    patterns = {}
    
    # Diagonal (la mejor de las dos)
    missing_d1 = [card_numbers[i] for i in d1_indices if card_numbers[i] not in drawn_balls]
    missing_d2 = [card_numbers[i] for i in d2_indices if card_numbers[i] not in drawn_balls]
    if len(missing_d1) <= len(missing_d2):
        patterns['diagonal'] = {"winner": len(missing_d1) == 0, "missing": missing_d1}
    else:
        patterns['diagonal'] = {"winner": len(missing_d2) == 0, "missing": missing_d2}
        
    # Letra X
    missing_x = [card_numbers[i] for i in x_indices if card_numbers[i] not in drawn_balls]
    patterns['letra_x'] = {"winner": len(missing_x) == 0, "missing": missing_x}
    
    # Marco
    missing_marco = [card_numbers[i] for i in marco_indices if card_numbers[i] not in drawn_balls]
    patterns['marco'] = {"winner": len(missing_marco) == 0, "missing": missing_marco}
    
    # Cartón Lleno
    missing_lleno = [card_numbers[i] for i in lleno_indices if card_numbers[i] not in drawn_balls]
    patterns['carton_lleno'] = {"winner": len(missing_lleno) == 0, "missing": missing_lleno}
    
    return jsonify({"status": "success", "patterns": patterns})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
