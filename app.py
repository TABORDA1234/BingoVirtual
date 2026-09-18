from flask import Flask, render_template, request, jsonify, redirect, url_for
from models import db, Game, Ball, Card
import random
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'bingo.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def get_letter_for_number(number):
    if 1 <= number <= 15: return 'B'
    elif 16 <= number <= 30: return 'I'
    elif 31 <= number <= 45: return 'N'
    elif 46 <= number <= 60: return 'G'
    elif 61 <= number <= 75: return 'O'
    return ''

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/screen')
def screen():
    return render_template('index.html')

@app.route('/play/<card_id>')
def play(card_id):
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
    
    missing = [n for n in card_numbers if n not in drawn_balls]
    
    if not missing:
        return jsonify({"status": "success", "winner": True, "message": "BINGO! You are a winner!"})
    else:
        return jsonify({"status": "success", "winner": False, "missing": missing, "message": f"Missing {len(missing)} numbers"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
