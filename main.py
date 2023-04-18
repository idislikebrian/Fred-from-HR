import logging
import utils
import random
import os
import bs4
import json
import posixpath
import time

import pytz

from setuptools import setup

## verified imports
import discord
import re
import requests

import sqlite3

import textwrap
import aiohttp

import datetime
from datetime import datetime
from datetime import date
from datetime import datetime, timedelta

from bs4 import BeautifulSoup
from urllib import request

import tmdbsimple as tmdb
tmdb.API_KEY = os.getenv('tmdb.API_KEY')

from discord.ext import tasks
from discord.ext import commands
from discord.utils import get

intents = discord.Intents.default()
intents.members = True

from keep_alive import keep_alive

conn = sqlite3.connect("bot_data.db")  # This creates the file "bot_data.db" if it doesn't exist
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    balance INTEGER,
    last_daily_claim TIMESTAMP,
    last_weekly_claim TIMESTAMP
)
""")
conn.commit()  # Commit the changes

# Get user balance
def get_balance(user_id):
    cursor.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    return result[0] if result else 0

# Update user balance
def update_balance(user_id, new_balance):
    cursor.execute("INSERT OR IGNORE INTO users (id, balance) VALUES (?, ?)", (user_id, new_balance))
    cursor.execute("UPDATE users SET balance = ? WHERE id = ?", (new_balance, user_id))
    conn.commit()

# Get user claim timestamp
def get_last_claim(user_id, claim_type):
    cursor.execute(f"SELECT {claim_type} FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    return result[0] if result else None

# Update user claim timestamp
def update_last_claim(user_id, claim_type, claim_timestamp):
    cursor.execute(f"INSERT OR IGNORE INTO users (id, {claim_type}) VALUES (?, ?)", (user_id, claim_timestamp))
    cursor.execute(f"UPDATE users SET {claim_type} = ? WHERE id = ?", (claim_timestamp, user_id))
    conn.commit()

newsSources = 'the-verge,the-wall-street-journal,vice-news,wired,politico,next-big-future,new-york-magazine,hacker-news,crypto-coins-news,ars-technica'
magicalAnswers = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"]
ceremonies = ["The Flying Spaghetti Monster", "the Illuminati", "a local school district", "a giant squid", "the devil", "get the iPhone X", "cure cancer", "Dictator Advaith"]
handshakes = ["https://media.tenor.com/images/180cdc8c0939a00e3674e7eeaf9056a3/tenor.gif", "https://media.tenor.com/images/67e822adc41a34c44c66b998109cd92b/tenor.gif", "https://media1.tenor.com/images/44830011193e0398e7464ed9a86a3643/tenor.gif", "https://media.tenor.com/images/08469d2b5bfbe6cfbdea49dd40ae6a08/tenor.gif", "https://media.tenor.com/images/fc9526c4dc48bce72a0639b29711d59c/tenor.gif", "https://media0.giphy.com/media/l1IYhmLyuCfgPL16g/giphy.gif", "https://media1.tenor.com/images/99af662eae886bacc009163ba3150168/tenor.gif?itemid=3846347", "https://media1.tenor.com/images/73b5c90fc5d2400300292ea8027225c2/tenor.gif?itemid=3400269"]
matches = ["10%. Your love isn't much.", "20%. Getting better!", "30%. A third of the way to true love.", "40%. Your love is getting great!", "50%. Halfway love!", "65%. I ship it!", "85%. The ship is sailing!", "100%. True love!" "69%. LOL best love!", "200%. You two should be married!"]
notFriends = ["buddy", "pal", "friend", "chief", "ace", "br0", "guy"]
deathmatches = ["`-coinflip`", "typeracer.com", "**One round** of <#814947576297160746>. (*Must be in that channel*)", "**Insults**", "`-roulette`"]
rouletteGIFS = ["https://tenor.com/t0pl.gif", "https://tenor.com/oGy9.gif", "https://tenor.com/umUQ.gif"]

client = commands.Bot(command_prefix='-', intents=intents)

@client.event
async def on_ready():
    print("Fred from HR is clocked in!")
    await client.change_presence(status=discord.Status.online, activity=discord.Game("with fire | -help | last update: 2023/04/17"), afk=False)

@client.event
async def on_member_join(member):
    print(f'{member} has joined the server.')
    time.sleep(15)
    await member.send("**Welcome to WORKSHOP!** I'm Fred... From HR. Here are some housekeeping items to get started:\n "
                        "\n 1. Don't forget to send a `-verify {@your-username}` message in the <#758754067173343254> channel to access the rest of ther server! (this is a spam-prevention measure)"
                        "\n 2. Introduce yourself over in <#708440927596970014>."
                        "\n 3. Visit <#746753317140561980> to get your notified for the right things."
                        "\n 4. We've made a <#762788672080052234> so you can get a lay of the land as well."
                        "\n \n See <#708439507309035623> for community guidelines. Long version here: https://www.notion.so/Welcome-to-Ws-READ-ME-721abbdd2f274e2da46a4308b2b6d9e8"
                        "\n Finally, to see what kind of cool things I can do, check me out here https://headwayapp.co/fred-from-hr-news/what-can-fred-from-hr-do-172725"
                        "\n If you need help or have any questions, please DM a Facilitator.")

@client.event
async def on_member_remove(member):
    print(f'{member} has left the server.')

@client.event
async def on_raw_reaction_add(payload):
    message = payload.message_id
    if message == 808727603808174121:
        guild_id = payload.guild_id
        guild = discord.utils.find(lambda g: g.id == guild_id, client.guilds)
        if payload.emoji.name == '🎟️':
            role = discord.utils.get(guild.roles, name="Legion Chef")
            member = payload.member

            if member is not None:
                await member.add_roles(role)
        print(payload.emoji.name)
        if payload.emoji.name == '🎮':
            role = discord.utils.get(guild.roles, name="Playfellow")
            member = payload.member

            if member is not None:
                await member.add_roles(role)
        if payload.emoji.name == '📈':
            role = discord.utils.get(guild.roles, name="Occupied")
            member = payload.member

            if member is not None:
                await member.add_roles(role)
        if payload.emoji.name == '🍿':
            role = discord.utils.get(guild.roles, name="Crowd")
            member = payload.member

            if member is not None:
                await member.add_roles(role)
    emoji = payload.emoji
    channel = payload.channel_id
    if channel == 709454636070862868: ## here i change the actual channel where the jobs post
        channel1 = client.get_channel(channel)
        msg = await channel1.fetch_message(message)
        d = str(msg.embeds[0].fields[1].value)
        t = d[:-1]
        d = int(t[2:])
        user = client.get_user(d)
        member = payload.member
        memberMention = member.mention
        await user.send("{} has reacted with {}! ".format(memberMention, emoji) + "Send them a DM.")

@client.command()
async def ping(ctx):
    await ctx.channel.send("To that, I say pong!")

@client.command(name='flip', aliases=['coin', 'coinflip'])
async def cointoss(ctx):
    coinSide = ['Heads', 'Tails']
    await ctx.channel.send(random.choice(coinSide))

@client.command()
async def magic8(ctx):
    inquiry = ctx.message.content
    actualInquiry = inquiry.split("magic8 ")
    channel = ctx.channel
    inquirerMention = ctx.message.author.mention
    inquiryStatement="Q: {}".format(actualInquiry[1])
    choice = random.randint(0, len(magicalAnswers))
    declaration = magicalAnswers[choice]
    embedVar = discord.Embed(title=":8ball: Magic 8 Ball", description=inquirerMention, color=0xf449d3)
    embedVar.add_field(name=inquiryStatement, value="A: " + declaration)
    await channel.send(embed=embedVar)
    ## await ctx.message.delete()

@client.command()
async def sacrifice(ctx, member: discord.Member):
    channel = ctx.channel
    person = ctx.message.author.id
    lamb = member.mention
    personMention = ctx.message.author.mention
    message = random.randint(0, len(ceremonies))
    ceremony = ceremonies[message]
    embedVar = discord.Embed(title=" ", description="{} has sacrificed {} to {}".format(personMention, lamb, ceremony), color=0xf449d3)
    await channel.send(embed=embedVar)
    await ctx.message.delete()

@client.command()
async def handshake(ctx,member : discord.Member):
    person1 = ctx.author.id
    person2 = member.mention
    message = random.randint(0,len(handshakes))
    ceremony = "<@{}> shook hands with {}".format(person1, person2)
    embedVar = discord.Embed(title=" ", description=ceremony, color=0xf449d3)
    embedVar.set_image(url=handshakes[message])
    await ctx.send(embed=embedVar)
    await ctx.message.delete()

@client.command()
async def match(ctx, member : discord.Member):
    person1 = ctx.author.id
    person2 = member.mention
    loveChoice = random.randint(0,len(matches))
    loveResult = matches[loveChoice]
    howMuch = "The love between <@{}> and {} is {} Keep expressing your love to each other and that could change!".format(person1, person2, loveResult)
    await ctx.send(howMuch)

@client.command()
async def hug(ctx, member: discord.Member):
    person1 = ctx.author.mention
    person2 = member.mention
    statement = f"{person1} hugged {person2} ♥"

    embedVar = discord.Embed(title=" ", description=statement)
    await ctx.send(embed=embedVar)
    await ctx.message.delete()

@client.command()
async def deathmatch(ctx, member : discord.Member):
    challenger = ctx.author.id
    challengee = member.mention
    challenge = random.randint(0, 4)
    statement = "<@{}> has challenged {} to a deathmatch. The trial will be {}.".format(challenger,challengee,deathmatches[challenge])
    embedVar = discord.Embed(title=" ", description=statement)
    await ctx.send(embed=embedVar)
    time.sleep(3)
    await ctx.message.delete()

@client.command()
async def roulette(ctx):
    embedLoading = discord.Embed(title=" ", description="Loading...")
    embedLoading.set_image(url="https://media1.tenor.com/images/69be09d0b37d5c4541bb2a01805ffabc/tenor.gif")
    await ctx.send(embed=embedLoading)
    user = ctx.author.id
    visual = random.randint(0, 2)
    choice = random.randint(1, 6)
    time.sleep(2)
    if choice > 1:
        embedVar = discord.Embed(title=" ", description="😰 <@{}>, you survived... This time.".format(user))
        await ctx.send(embed=embedVar)
    else:
        await ctx.send(rouletteGIFS[visual])
        time.sleep(2)
        embedVar = discord.Embed(title=" ", description="**BANG!** ⚰ <@{}> died. RIP.".format(user))
        await ctx.send(embed=embedVar)

@client.command()
async def verify(ctx, member: discord.Member):
    # Check if the command is being executed in the correct channel
    verification_channel_name = "🤝・verification"
    verification_channel = discord.utils.get(ctx.guild.text_channels, name=verification_channel_name)

    if ctx.channel != verification_channel:
        await ctx.send(f"Please use this command in the {verification_channel.mention} channel.")
        return

    # Check if the member is already verified
    verified_role_name = "VERIFIED"
    verified_role = discord.utils.get(member.guild.roles, name=verified_role_name)

    if verified_role in member.roles:
        await ctx.send(f"{member.mention} is already verified.")
        return

    # Add the role to the member
    await member.add_roles(verified_role)
    await ctx.send(f"{member.mention} has been verified.")

@client.command()
async def movie(ctx, *, theMovie):
    search = tmdb.Search()
    response = search.movie(query=theMovie)

    if not search.results:
        not_friend = random.choice(notFriends)
        await ctx.send(f"Movie not found, {not_friend}")
        return

    s = search.results[0]

    image = s.get('poster_path')
    imageURL = f"https://image.tmdb.org/t/p/w300_and_h450_bestv2{image}"
    
    release = datetime.strptime(s['release_date'], "%Y-%m-%d")
    tmdbID = s['id']

    movie = tmdb.Movies(tmdbID)
    movie_info = movie.info()
    movie_credits = movie.credits()

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
        title=f"{s['title']} ({release.year})",
        description=textwrap.dedent(f"""\
            {s['overview']}
            (Budget: {budget_currency})
        """),
        color=0x507fff
    )

    embedVar.set_thumbnail(url=imageURL)
    embedVar.add_field(name="Rating", value=f"{s['vote_average']} (out of 10)", inline=True)
    embedVar.add_field(name="Language", value=s['original_language'])
    embedVar.add_field(name=director_label, value=director)
    embedVar.add_field(name="Genres", value=genres)
    embedVar.add_field(name="Runtime", value=time)
    embedVar.set_footer(text='This data is pulled from TMDb.com')

    await ctx.send(embed=embedVar)

@client.command()
@commands.cooldown(1, 5, commands.BucketType.member)
async def book(ctx, *, theBook):
    await ctx.send("Give me a second to search all the libraries in the world...")
    poss = random.randint(0, len(notFriends))
    friend = notFriends[poss]
    try:
        d = ''
        for x in theBook:
            if x == ' ':
                d += '+'
            else:
                d += x
        link = "https://www.goodreads.com/search?utf8=%E2%9C%93&query=" + d
        bookPage = requests.get(link)
        extraData = BeautifulSoup(bookPage.content, 'html.parser')
        element = extraData.find_all("a", href=True)
        x = element[106]
        text = x['href']
        searchResult = "https://www.goodreads.com{}".format(text)
        bookScrub = requests.get(searchResult)
        bookData = BeautifulSoup(bookScrub.content, 'html.parser')
        element1 = bookData.find("div", attrs={"id":"description"})
        bookTitle = (bookData.find("h1", attrs={"id":"bookTitle"})).text
        bookAuthor = (bookData.find("span", attrs={"itemprop":"name"})).text
        rating = (bookData.find("span", attrs={"itemprop": "ratingValue"})).text
        imageURL = bookData.find("img", attrs={"id": "coverImage"})['src']
        d = element1.text
        print(d)
        c = ''
        counter = 0
        while counter < 140:
            try:
                c += d[counter]
            except:
                pass
            counter += 1
        print(c)
        c += "..."
        embedVar = discord.Embed(title=bookTitle, description="by " + bookAuthor, color=0x507fff)
        embedVar.set_thumbnail(url=imageURL)
        embedVar.add_field(name="Overview", value=c + " [Read more]({})".format(searchResult), inline=True)
        embedVar.add_field(name="Rating", value=rating, inline=True)
        embedVar.set_footer(text='This data is pulled from Goodreads.com')
        await ctx.send(embed=embedVar)
    except:
        await ctx.send("That's not a book, " + friend)

@client.command()
@commands.cooldown(1, 10, commands.BucketType.member)
async def gig(ctx, *, description):
    elements = str(description).split("//")
    id = ctx.channel.id
    poss = random.randint(0, len(notFriends))
    friend = notFriends[poss]
    poster = ctx.message.author
    if len(elements) == 3 and id == 769237764612030514: ##change id to listing channel
        inquirerMention = ctx.message.author.mention
        embedVar = discord.Embed(title="⚠ GIG ALERT! ⚠ -- " + elements[0], description=elements[2], color=0x952fff)
        embedVar.add_field(name="Budget", value=elements[1])
        embedVar.add_field(name="Posted by ", value=inquirerMention)
        channel = discord.utils.get(client.get_all_channels(), name="📰・classifieds")
        react = await channel.send(embed=embedVar)
        await react.add_reaction('✔')
        await poster.send("Your job listing is live in <#709454636070862868>! Go check it out.")
    else:
        await ctx.send("Looks like you're missing some elements, " + friend)
        time.sleep(1)
        embedVar = discord.Embed(title="🆘 Need help?", description="You need to list the name of your gig first, then your budget, followed by a nice detailed description.", color=0xff962a)
        embedVar.add_field(name="i.e.", value="`-gig {job-title} // {budget} // {description}`")
        embedVar.add_field(name="Sample", value="-gig I need a rockstar podcast editor // $30 // A very detailed description of the type of talent you need, how may people you're looking to hire, and the kind of work you need to be done.")
        await ctx.send(embed=embedVar)

async def fetch(url, session):
  async with session.get(url) as response:
    return await response.text()

async def fetch_quote(session):
  quote_url = "https://zenquotes.io/api/random"
  async with session.get(quote_url) as response:
    quote_data = await response.json()
    return f"{quote_data[0]['q']} - {quote_data[0]['a']}"

async def fetch_today_in_history(today, session):
  month, day = today.split('-')[1:]
  today_in_history_url = f"https://history.muffinlabs.com/date/{month}/{day}"
  async with session.get(today_in_history_url) as response:
    history_data = await response.json()
    event = history_data["data"]["Events"][0]
    return f"{event['year']}: {event['text']}"

async def fetch_random_fact(session):
  fact_url = "https://uselessfacts.jsph.pl/random.json?language=en"
  async with session.get(fact_url) as response:
    fact_data = await response.json()
    return fact_data["text"]

async def fetch_daily_joke(session):
  joke_url = "https://v2.jokeapi.dev/joke/Any"
  async with session.get(joke_url) as response:
    joke_data = await response.json()
    if joke_data["type"] == "single":
      return joke_data["joke"]
    else:
      return f"{joke_data['setup']} - {joke_data['delivery']}"

@client.command()
async def memo(ctx):
    role = discord.utils.get(ctx.guild.roles, name='Facilitator')
    if role in ctx.author.roles:
        today = str(date.today())

        async with aiohttp.ClientSession() as session:
            wordpage_content = await fetch("https://www.merriam-webster.com/word-of-the-day/", session)
            questionpage_content = await fetch("https://conversationstartersworld.com/random-question-generator/", session)
            daily_quote = await fetch_quote(session)
            today_in_history = await fetch_today_in_history(today, session)
            random_fact = await fetch_random_fact(session)
            daily_joke = await fetch_daily_joke(session)

        word = BeautifulSoup(wordpage_content, 'html.parser')
        todaysword = word.find("h1").text
        formsofspeech = word.find("span", {"class": "main-attr"}).text
        definition = word.find("p").text

        questionpage = BeautifulSoup(questionpage_content, 'html.parser')
        h2_tag = questionpage.find("h2", {"id": "h-your-random-question"})
        thequestion = h2_tag.find_next_sibling(text=True).strip()

        if len(thequestion) > 1024:
            thequestion = thequestion[:1021] + "..."

        embedVar = discord.Embed(title="DAILY MEMORANDUM", description="SUBJECT: " + today, color=0xFFFF88)
        embedVar.add_field(name="**Daily Curiosity**", value=thequestion + "\n\n", inline=True)
        embedVar.add_field(name="**Word of the Day**", value=f"{todaysword} *({formsofspeech})* \n{definition}\n\n🧠 *Try using '{todaysword}' in a sentence today.*\n\n", inline=False)
        embedVar.add_field(name="**Inspirational Quote**", value=daily_quote, inline=False)
        embedVar.add_field(name="**Today in History**", value=today_in_history, inline=False)
        embedVar.add_field(name="**Random Fact**", value=random_fact, inline=False)
        embedVar.add_field(name="**Daily Joke**", value=daily_joke, inline=False)

        channel = discord.utils.get(ctx.guild.channels, id=708336363757371396)  # change channel to 756345085259677701 for testing
        await channel.send(embed=embedVar)
    else:
        time.sleep(1)
        await ctx.send("Only a <@&709389579651645502> can use this command.")

import asyncio
from collections import defaultdict

async def countdown(ctx, game_message):
  await asyncio.sleep(30)
  embedVar = discord.Embed(title="Cee-lo", description=f"Starting in 30 seconds! [Jump to start]({game_message.jump_url})", color=0xffa500)
  await ctx.send(embed=embedVar)
  await asyncio.sleep(15)
  embedVar = discord.Embed(title="Cee-lo", description=f"Starting in 15 seconds! [Jump to start]({game_message.jump_url})", color=0xff0000)
  await ctx.send(embed=embedVar)
  
# Helper function to determine the roll outcome
def cee_lo_outcome(roll):
  roll.sort()
  if roll[0] == roll[1] == roll[2]:
    return ('Triple', roll[0])
  elif roll == [1, 2, 3]:
    return ('Automatic Loss', None)
  elif roll == [4, 5, 6]:
    return ('Automatic Win', None)
  elif roll[0] == roll[1]:
    return ('Point', roll[2])
  elif roll[1] == roll[2]:
    return ('Point', roll[0])
  else:
    return ('No Point', None)

active_games = defaultdict(lambda: {'players': set(), 'game_running': False})

@client.command()
async def roll(ctx):
  # Restrict the command to the specific channel
  allowed_channel_id = 814947576297160746
  if ctx.channel.id != allowed_channel_id:
      embedVar = discord.Embed(title="Cee-lo", description="Let's keep the game in the  <#814947576297160746> channel :wink:", color=0xf449d3)
      await ctx.send(embed=embedVar)
      return

  channel = ctx.channel
  if active_games[channel]['game_running']:
        embedVar = discord.Embed(title="Cee-lo", description="A game is already in progress.", color=0xf449d3)
        await ctx.send(embed=embedVar)
        return

  active_games[channel]['game_running'] = True
  embedVar = discord.Embed(title=f"A game of Cee-lo hosted by {ctx.author.name}", description="A new Cee-lo game is about to start in 60 seconds, please react with 🎲 to participate in this round.", color=0xf449d3)
  game_message = await ctx.send(embed=embedVar)
  await game_message.add_reaction("🎲")

  def check(reaction, user):
      return user != client.user and str(reaction.emoji) == "🎲"

  countdown_task = asyncio.create_task(countdown(ctx, game_message))

  while True:
    try:
      reaction, user = await client.wait_for("reaction_add", timeout=60, check=check)
      if user not in active_games[channel]['players']:
        active_games[channel]['players'].add(user)
    except asyncio.TimeoutError:
      break

    countdown_task.cancel()

  # Check if there are at least two players
    if not active_games[channel]['players'] or len(active_games[channel]['players']) < 2:
        embedVar = discord.Embed(title="Cee-lo", description=f"No one wanted the smoke from {ctx.author.mention}. Ending the game.", color=0xf449d3)
        await ctx.send(embed=embedVar)
        active_games[channel]['game_running'] = False
        return

    participant_mentions = ", ".join([player.mention for player in active_games[channel]['players']])
    embedVar = discord.Embed(title="Started a new game of Cee-lo", description=f"Number of participants: {len(active_games[channel]['players'])}", color=0xf449d3)
    embedVar.add_field(name="Participants", value=participant_mentions, inline=False)
    await ctx.send(embed=embedVar)
    await asyncio.sleep(2)

    winner = None
    max_rank = -1

    for player in active_games[channel]['players']:
        outcome = 'No Point'
        while outcome == 'No Point':
            roll = [random.randint(1, 6) for _ in range(3)]
            outcome, point = cee_lo_outcome(roll)

        embedVar = discord.Embed(title="Cee-lo", description=f"{player.mention} rolled:", color=0xf449d3)
        embedVar.add_field(name="🎲", value=f"{roll[0]}, {roll[1]}, {roll[2]} ({outcome})", inline=False)
        await channel.send(embed=embedVar)
        await asyncio.sleep(2)

        # Check for automatic win
        if outcome == "Automatic Win":
            winner = player
            embedVar = discord.Embed(title="Cee-lo", description=f"🎉 {winner.mention} wins the game with an Automatic Win! 🎉", color=0xffff00)
            await ctx.send(embed=embedVar)
            active_games[channel]['game_running'] = False
            return

        rank = 0
        if outcome == "Triple":
            rank = 10 + point
        elif outcome == "Point":
            rank = point

        if rank > max_rank:
            max_rank = rank
            winner = player

        # Check for automatic loss
    if max_rank == 0:
        embedVar = discord.Embed(title="Cee-lo", description="All players rolled an Automatic Loss. There is no winner.", color=0xf449d3)
        await ctx.send(embed=embedVar)
    else:
        await asyncio.sleep(2)
        embedVar = discord.Embed(title="Cee-lo", description=f"🎉 {winner.mention} wins the game with {max_rank} points! 🎉", color=0xffff00)
        await ctx.send(embed=embedVar)

    active_games[channel]['game_running'] = False
  
@client.event
async def on_command_error(ctx, error):
    print(error)
    if isinstance(error, commands.MissingRequiredArgument):
        cmd = ctx.invoked_with

        help_messages = {
            "gig": ("You need to list the name of your gig first, then your budget, followed by a nice detailed description.",
                    "i.e.", "`-gig {job-title} // {budget} // {description}`",
                    "Sample", "-gig I need a rockstar podcast editor // $30 // A very detailed description of the type of talent you need, how may people you're looking to hire, and the kind of work you need to be done."),
            "movie": ("Give me the title of the movie you're talking about.",
                      "i.e.", "`-movie {movie-title}`"),
            "book": ("Give me the title of the book you're talking about.",
                     "i.e.", "`-book {book-title}`"),
            "ticker": ("Give me the name of the company you're looking to get the NYSE price for (both the ticker symbol and the company name work fine).",
                       "i.e.", "`-ticker {company-name}` OR `-ticker {ticker-symbol}`"),
            "sacrifice": ("So you're trying to sacrifice someone? Don't forget to mention the person you're trying to sacrifice.",
                          "i.e.", "`-sacrifice {username}`"),
            "handshake": ("To give a handshake, you typically need two parties involved. Mention the other person.",
                          "i.e.", "`-handshake {username}`"),
            "magic8": ("Ask the all-knowing Magic 8 Ball a question you want answered.",
                       "i.e.", "`-magic8 {question-you-want-answered}`"),
            "hug": ("Trying to show some love? Mention the person you're trying to hug. Don't forget about consent.",
                    "i.e.", "`-hug {username}`"),
            "match": ("The way you use our love meter is by mentioning the person you want to gauge your love with.",
                      "i.e.", "`-match {username}`"),
            "verify": ("Make sure you're including your own username.",
                       "i.e.", "`-verify {your-username}`")
        }

        if cmd in help_messages:
            embedVar = discord.Embed(title="🆘 Need help?", description=help_messages[cmd][0], color=0xff962a)
            for i in range(1, len(help_messages[cmd]), 2):
                embedVar.add_field(name=help_messages[cmd][i], value=help_messages[cmd][i+1])
            await ctx.send(embed=embedVar)

@client.command()
async def daily(ctx):
    user_id = ctx.author.id
    last_daily_claim = get_last_claim(user_id, "last_daily_claim")

    if last_daily_claim and datetime.strptime(last_daily_claim, "%Y-%m-%d %H:%M:%S") + timedelta(days=1) > datetime.utcnow():
        next_daily = (datetime.strptime(last_daily_claim, "%Y-%m-%d %H:%M:%S") + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        embedVar = discord.Embed(title="💵 Daily Reward 💵", description="You have already claimed your daily reward!", color=0xf449d3)
        embedVar.add_field(name="Next:", value=next_daily, inline=False)
    else:
        update_balance(user_id, get_balance(user_id) + 1000)
        update_last_claim(user_id, "last_daily_claim", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

        next_daily = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        embedVar = discord.Embed(title="💵 Daily Reward 💵", description="You have claimed your daily reward!", color=0xf449d3)
        embedVar.add_field(name="Contains:", value="🧧 1,000", inline=False)
        embedVar.add_field(name="Available every:", value="24 hours", inline=False)
        embedVar.add_field(name="Next:", value=next_daily, inline=False)

    await ctx.send(embed=embedVar)

@client.command()
async def weekly(ctx):
    user_id = ctx.author.id
    last_weekly_claim = get_last_claim(user_id, "last_weekly_claim")

    if last_weekly_claim and datetime.strptime(last_weekly_claim, "%Y-%m-%d %H:%M:%S") + timedelta(days=7) > datetime.utcnow():
        next_weekly = (datetime.strptime(last_weekly_claim, "%Y-%m-%d %H:%M:%S") + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        embedVar = discord.Embed(title="💰 Weekly Reward 💰", description="You have already claimed your weekly reward!", color=0xf449d3)
        embedVar.add_field(name="Next:", value=next_weekly, inline=False)
    else:
        update_balance(user_id, get_balance(user_id) + 10000)
        update_last_claim(user_id, "last_weekly_claim", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

        next_weekly = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        embedVar = discord.Embed(title="💰 Weekly Reward 💰", description="You have claimed your weekly reward!", color=0xf449d3)
        embedVar.add_field(name="Contains:", value="🧧 10,000", inline=False)
        embedVar.add_field(name="Available every:", value="7 days", inline=False)
        embedVar.add_field(name="Next:", value=next_weekly, inline=False)

    await ctx.send(embed=embedVar)

@client.command()
async def balance(ctx):
  user_id = ctx.author.id
  current_balance = get_balance(user_id)
  
  embedVar = discord.Embed(title="💳 Balance 💳", description=f"{ctx.author.mention}, your current balance is:", color=0xf449d3)
  embedVar.add_field(name="Amount:", value=f"{current_balance}", inline=False)
  
  await ctx.send(embed=embedVar)

keep_alive()
client.run(os.getenv('TOKEN'))

## Fred from HR is a little discord bot by idislikebrian#4281
## **Add to your server**: Coming soon...