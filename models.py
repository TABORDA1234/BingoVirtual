from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    active = db.Column(db.Boolean, default=True)
    balls = db.relationship('Ball', backref='game', lazy=True)

class Ball(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    letter = db.Column(db.String(1), nullable=False)
    number = db.Column(db.Integer, nullable=False)

class Card(db.Model):
    id = db.Column(db.String(3), primary_key=True)
    password = db.Column(db.String(6), nullable=False)
    numbers = db.Column(db.Text, nullable=False)
    
    def get_numbers(self):
        import json
        return json.loads(self.numbers)
