# 툴들 추가
# 1. 네이버 뉴스를 가져온다. 배웠음 (API-key)
# 2. 구글 검색으로 기업 개요/최근 정보를 조회한다. 배웠음 (API-key)
# 3. 환율을 조회한다.
# 4. 주가를 조회한다.

def get_news():
    return "미구현"

def get_comany_info():
    return "미구현"

def get_exchange_rate():
    # https://open.er-api.com/v6/latest/USD
    return "미구현"

def get_stock_price(ticker):
    """ yfinance 로 다양한 기업의 주가를 가져온다.
    예) 애플('APPL') 과 삼성전자('005930.KS')"""

    # pip install yfinance 
    import yfinance as yf
    data = yf.Ticker(ticker).history(period="1d")

    return "미구현"

TOOLS = [get_news, get_comany_info, get_exchange_rate, get_stock_price]

