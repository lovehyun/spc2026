# 툴들 추가
# 1. 네이버 뉴스를 가져온다. 배웠음 (API-key)
# 2. 구글 검색으로 기업 개요/최근 정보를 조회한다. 배웠음 (API-key)
# 3. 환율을 조회한다.
# 4. 주가를 조회한다.

import os
import re
import requests
from langchain_core.tools import tool

@tool
def get_news(query: str) -> str:
    """ 네이버 뉴스에서 키워드로 최신 기사 제목/링크를 검색한다. """
    naver_cid = os.getenv("NAVER_CLIENT_ID")
    naver_secret = os.getenv("NAVER_CLIENT_SECRET")
    if not (naver_cid and naver_secret):
        return "네이버 뉴스 API키가 올바르게 등록되지 않아, 현재 네이버 뉴스 검색을 할 수 없습니다."

    resp = requests.get("https://openapi.naver.com/v1/search/news.json",
                params={"query": query, "display": 5, "sort": "date"},
                headers={"X-Naver-Client-Id": naver_cid, "X-Naver-Client-Secret": naver_secret})

    items = resp.json().get("items", [])
    if not items:
        return f"'{query}' 관련 뉴스 없음"

    return "\n".join(f"- {re.sub(r'<[^>]+>', '', it['title'])} ({it['link']})" for it in items)

@tool
def get_company_info(company: str) -> str:
    """ 구글 검색(Serper)으로 기업 개요/최근 정보를 조회한다 """
    key = os.getevn("SERPER_API_KEY")
    if not key:
        return "SERPER_API_KEY 가 미설정되어 기업 정보 검색이 불가합니다."
    
    return "미구현"

@tool
def get_exchange_rate(base: str="USD", target: str="KRW") -> str:
    """ 환율을 조회한다. 예: base=USD, target=KRW """
    resp = requests.get(f"https://open.er-api.com/v6/latest/{base.upper()}")

    rate = resp.json().get("rates", {}).get(target.upper())
    if rate is None:
        return f"{base} -> {target} 환율 조회에 실패하였습니다."

    return f"1 {base.upper} = {rate} {target.upper()}"   # 1 USD = 1500 KRW

@tool
def get_stock_price(ticker):
    """ yfinance 로 다양한 기업의 주가를 가져온다.
    예) 애플('APPL') 과 삼성전자('005930.KS')"""

    # pip install yfinance 
    import yfinance as yf
    data = yf.Ticker(ticker).history(period="1d")
    if data.empty:
        return f"'{ticker}' 조회에 실패하였습니다. 주식 종목을 yfinance에 잘 맞게 알아와서 입력하세요."

    return f"{ticker} 현재가: {round(float(data['Close'].iloc[-1]), 2)}"

TOOLS = [get_news, get_company_info, get_exchange_rate, get_stock_price]

