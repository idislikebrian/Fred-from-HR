import discord
import requests
import time
import os
from discord.ext import commands
from pycoingecko import CoinGeckoAPI

ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY')

cg = CoinGeckoAPI()

class FinanceCog(commands.Cog):
  def __init__(self, client):
    self.client = client

  def crypto_price(self, searching):
    coin_list = cg.get_coins_list()
    last_step = searching.replace('-', ' ')
    ref, sym, nam = None, None, None

    for coin in coin_list:
        if coin['id'] == searching or coin['symbol'] == searching or coin['name'] == last_step.capitalize():
            ref = coin['id']
            sym = coin['symbol']
            nam = coin['name']
            break

    if not ref:
        return None

    elementVar = cg.get_price(ids=ref, vs_currencies='usd,eur,jpy', include_market_cap='true', include_24hr_vol='true', include_24hr_change='true')
    return elementVar, ref, sym, nam

  @commands.command()
  async def crypto(self, ctx, *, searchTerm: str):
    searchTerm = searchTerm.lower().replace(' ', '-')
    results = crypto_price(searchTerm)

    if not results:
      await ctx.send("No cryptocurrency found for the given search term.")
      return

    elementVar, ref, sym, nam = results
    thumb = cg.get_coin_by_id(ref)
    get_thum = thumb['image']['thumb']

    currencies = [
      ('usd', 'USD', ':flag_us:'),
      ('eur', 'EUR', ':flag_eu:'),
      ('jpy', 'JPY', ':flag_jp:')
    ]

    embedVar = discord.Embed(title=f"{nam} ({sym.upper()})", description=" ", color=0x85bb65)

    for currency, currency_upper, flag in currencies:
      formatted_price = f"{currency_upper} {elementVar[ref][currency]:,.2f}"
      hr24change = elementVar[ref][f'{currency}_24h_change']
      formatted_hr24change = "{:.2%}".format(.01 * hr24change)

      embedVar.add_field(name="***", value=flag)
      embedVar.add_field(name=f"**{currency_upper}**", value=formatted_price)
      embedVar.add_field(name="**Percent Change**", value=formatted_hr24change, inline=True)

    embedVar.set_thumbnail(url=get_thum)
    embedVar.set_footer(text="This command uses the CoinGecko API", icon_url="https://i.imgur.com/5ceiK2e.png")

    await ctx.channel.send(embed=embedVar)
  
  @commands.command()
  async def ticker(self, ctx, query: str = None):
    if query is None:
      await ctx.channel.send("Please provide a ticker symbol or company name.")
      return

    try:
      # Get the ticker symbol using the company name or symbol
      search_url = f"https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={query}&apikey={self.ALPHA_VANTAGE_API_KEY}"
      search_response = requests.get(search_url)
      search_data = search_response.json()

      if not search_data['bestMatches']:
        await ctx.channel.send("No matching ticker symbol or company name found.")
        return

      # Filter search results to prioritize US-based stocks
      search_results = search_data['bestMatches']
      us_based_results = [result for result in search_results if result['4. region'] == 'United States']

      if us_based_results:
        best_match = us_based_results[0]
        alternative_matches = us_based_results[1:4]
      else:
        best_match = search_results[0]
        alternative_matches = search_results[1:4]

      ticker = best_match['1. symbol']
      company_name = best_match['2. name']

      # Fetch stock data from Finnhub API
      api_url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={self.FINNHUB_API_KEY}"
      api_response = requests.get(api_url)
      stock_data = api_response.json()

      # Extract and format data
      price = stock_data.get("c")
      change = stock_data.get("d")
      changePercent = stock_data.get("dp")

      # Check if the data is missing
      if price is None:
        await ctx.channel.send("The current stock price is unavailable. Please try again later.")
        return

      if change is None or changePercent is None:
        await ctx.channel.send(f"The current stock price for {company_name} (${ticker}) is ${price}. Change data is unavailable.")
        return

      percentage = "{:.2f}%".format(changePercent)
      statementsChange = "${} / {}".format(change, percentage)

      # Create and send embed message
      embedVar = discord.Embed(title=f"{company_name} (${ticker})", description=f"The current stock price is ${price}", color=0x85bb65)
      embedVar.add_field(name="24h Change [Price(USD) / Percent]", value=statementsChange)
      await ctx.channel.send(embed=embedVar)

      # Send alternative results
      if alternative_matches:
        time.sleep(1)
        alternatives_text = "\n".join([f"{result['2. name']} (${result['1. symbol']})" for result in alternative_matches])
        await ctx.channel.send(f"**Alternative results:**\n{alternatives_text}")

    except Exception as e:
      print(f"Error fetching stock data for {query}: {e}")
      await ctx.channel.send("There was an error fetching the stock data. Please try again.")