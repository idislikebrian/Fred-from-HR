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
from cogs.finance import FinanceCog
from cogs.ceelo import CeeloCog
from cogs.media import MediaCog
from cogs.fun import FunCog

from utils import notFriends

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


client = commands.Bot(command_prefix='-', intents=intents)

@client.event
async def on_ready():
  print("Fred from HR is clocked in!")
  client.add_cog(FinanceCog(client))
  client.add_cog(CeeloCog(client))
  client.add_cog(MediaCog(client))
  client.add_cog(FunCog(client))
  await client.change_presence(status=discord.Status.online, activity=discord.Game("with fire | -help | last update: 2023/04/18"), afk=False)

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