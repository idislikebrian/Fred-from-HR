import asyncio
import textwrap
import random
from datetime import datetime
from bs4 import BeautifulSoup
import requests
import os
import discord
from discord.ext import commands

import tmdbsimple as tmdb
tmdb.API_KEY = os.getenv('tmdb.API_KEY')

from utils import notFriends

class MediaCog(commands.Cog):
  def __init__(self, client):
    self.client = client

  @commands.command()
  async def movie(self, ctx, *, theMovie):
    search_results = await search_movies(theMovie)

    if not search_results:
        not_friend = random.choice(notFriends)
        await ctx.send(f"Movie not found, {not_friend}")
        return

    await display_movie(ctx, search_results[0])

  @commands.command()
  @commands.cooldown(1, 5, commands.BucketType.member)
  async def book(self, ctx, *, theBook):
    await ctx.send("Give me a second to search all the libraries in the world...")
    search_results = await search_books(theBook)

    if not search_results:
      not_friend = random.choice(notFriends)
      await ctx.send(f"That's not a book, {not_friend}")
      return

    await display_book(ctx, search_results[0])

async def display_movie(ctx, movie):
  image = movie.get('poster_path')
  imageURL = f"https://image.tmdb.org/t/p/w300_and_h450_bestv2{image}"
  
  release = datetime.strptime(movie['release_date'], "%Y-%m-%d")
  tmdbID = movie['id']

  movie_instance = tmdb.Movies(tmdbID)
  movie_info = movie_instance.info()
  movie_credits = movie_instance.credits()

  director = ', '.join([
    crew_member['name']
    for crew_member in movie_credits['crew']
    if crew_member['job'] == 'Director'
  ])

  genres = ', '.join([genre["name"] for genre in movie_info["genres"]])

  runtime = movie_info["runtime"]
  hours, minutes = divmod(runtime, 60)
  hours_plural = "hour" if hours == 1 else "hours"
  minutes_plural = "minute" if minutes == 1 else "minutes"
  time = f"{hours} {hours_plural} and {minutes} {minutes_plural}"

  budget_currency = "${:,.2f}".format(movie_info["budget"])

  director_label = "Director" if len(director.split(', ')) == 1 else "Directors"

  embedVar = discord.Embed(
    title=f"{movie['title']} ({release.year})",
    description=textwrap.dedent(f"""\
      {movie['overview']}
      (Budget: {budget_currency})
    """),
    color=0x507fff
  )

  embedVar.set_thumbnail(url=imageURL)
  embedVar.add_field(name="Rating", value=f"{movie['vote_average']} (out of 10)", inline=True)
  embedVar.add_field(name="Language", value=movie['original_language'])
  embedVar.add_field(name=director_label, value=director)
  embedVar.add_field(name="Genres", value=genres)
  embedVar.add_field(name="Runtime", value=time)
  embedVar.set_footer(text='This data is pulled from TMDb.com')

  await ctx.send(embed=embedVar)

async def search_movies(query):
  search = tmdb.Search()
  search.movie(query=query)

  if not search.results:
    return None

  search_results = search.results
  return search.results

async def display_book(ctx, book):
  title = book["title"]
  author = book["author"]
  rating = book["rating"]
  imageURL = book["imageURL"]
  description = book["description"]
  link = book["link"]

  embedVar = discord.Embed(title=title, description=f"by {author}", color=0x507fff)
  embedVar.set_thumbnail(url=imageURL)
  embedVar.add_field(name="Overview", value=f"{description}... [Read more]({link})", inline=True)
  embedVar.add_field(name="Rating", value=rating, inline=True)
  embedVar.set_footer(text='This data is pulled from Goodreads.com')
  
  await ctx.send(embed=embedVar)

async def search_books(query):
  url = f'http://openlibrary.org/search.json?q={query}'
  response = requests.get(url)
  
  if response.status_code != 200:
    return None

  search_data = response.json()

  if not search_data or 'docs' not in search_data or not search_data['docs']:
    return None

  book = search_data['docs'][0]

  title = book.get('title', 'Title not found')
  author_name = book.get('author_name', ['Author not found'])[0]
  first_publish_year = book.get('first_publish_year', 'Unknown')
  cover_i = book.get('cover_i', '')

  if cover_i:
    image_url = f'http://covers.openlibrary.org/b/id/{cover_i}-M.jpg'
  else:
    image_url = ''

  return {
    'title': title,
    'author': author_name,
    'year': first_publish_year,
    'image_url': image_url
  }

def setup(client):
    client.add_cog(MediaCog(client))