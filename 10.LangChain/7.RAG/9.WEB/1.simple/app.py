from flask import Flask, request, jsonify, render_template

# 랭체인 기본 불러오기

# 문서 파서 기본 불러오기 (PyPDFLoader)

# 1. 백터스토어 셋업

# 2. 랭체인 셋업한다 (LCEL)



##########
# Flask 
##########
app = Flask(__name__)

@app.get('/')
def index():
    return render_template('index.html')

@app.post('/upload')
def upload():
    return jsonify({"message":"업로드 완료"})

@app.post('/ask')
def ask():
    return jsonify({"answer": "답변 완료"})

if __name__ == "__main__":
    app.run(debug=True)
