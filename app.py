from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dash')
def dashboard():
    return render_template('dashboard.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/reviewer')
def reviewer():
    return render_template('reviewer.html')

if __name__ == '__main__':
    app.run(debug=True)