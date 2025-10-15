import flask
from flask import current_app

home_view = flask.Blueprint('home_view', __name__, template_folder='templates')

@home_view.route('/')
def index():
    return "Hello World"
