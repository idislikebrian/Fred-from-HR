import discord
from discord.ext import commands
from typing import Union

import asyncio
import random

from utils import matches, magicalAnswers, ceremonies, handshakes, rouletteGIFS, deathmatches

class FunCog(commands.Cog):
  def __init__(self, client):
    self.client = client
      
  @commands.command(name='flip', aliases=['coin', 'coinflip'])
  async def cointoss(self, ctx, member_or_prediction: Union[discord.Member, str] = None):
    coin_sides = ['heads', 'tails']
    result = random.choice(coin_sides)
    
    if member_or_prediction is None:
        await ctx.send(f"{ctx.author.mention}, the coin landed on {result.capitalize()}!")
    elif isinstance(member_or_prediction, discord.Member):
        member = member_or_prediction
        await ctx.send(f"{member.mention}, the coin landed on {result.capitalize()}!")
    else:
        prediction = member_or_prediction.lower()
        if prediction not in coin_sides:
            await ctx.send(f"{ctx.author.mention}, that's an invalid prediction. Please use 'heads' or 'tails'.")
        else:
            is_correct = prediction == result
            if is_correct:
                await ctx.send(f"{ctx.author.mention}, your prediction was correct! The coin landed on {result.capitalize()}!")
            else:
                await ctx.send(f"{ctx.author.mention}, your prediction was incorrect. The coin landed on {result.capitalize()}.")


  @commands.command()
  async def magic8(self, ctx, *, inquiry: str):
    await asyncio.sleep(2)
    channel = ctx.channel
    inquirer_mention = ctx.author.mention
    inquiry_statement = f"Q: {inquiry}"
    choice = random.choice(magicalAnswers)
    embed_var = discord.Embed(title=":8ball: Magic 8 Ball", description=inquirer_mention, color=0xf449d3)
    embed_var.add_field(name=inquiry_statement, value="A: " + choice)
    await channel.send(embed=embed_var)
  
  @commands.command()
  async def sacrifice(self, ctx, member: discord.Member):
    channel = ctx.channel
    lamb = member.mention
    person_mention = ctx.author.mention
    ceremony = random.choice(ceremonies)
    embed_var = discord.Embed(title=" ", description=f"{person_mention} has sacrificed {lamb} to {ceremony}", color=0xf449d3)
    await channel.send(embed=embed_var)
    await ctx.message.delete()
  
  @commands.command()
  async def handshake(self, ctx, member: discord.Member):
    person1 = ctx.author.id
    person2 = member.mention
    ceremony = f"<@{person1}> shook hands with {person2}"
    handshake_image = random.choice(handshakes)
    embed_var = discord.Embed(title=" ", description=ceremony, color=0xf449d3)
    embed_var.set_image(url=handshake_image)
    await ctx.send(embed=embed_var)
    await ctx.message.delete()
  
  @commands.command()
  async def match(self, ctx, member: discord.Member):
    person1 = ctx.author.id
    person2 = member.mention
    love_result = random.choice(matches)
    how_much = f"The love between <@{person1}> and {person2} is {love_result} Keep expressing your love to each other, and that could change!"
    await ctx.send(how_much)
  
  @commands.command()
  async def hug(ctx, member: discord.Member):
      person1 = ctx.author.mention
      person2 = member.mention
      statement = f"{person1} hugged {person2} ♥"
      embedVar = discord.Embed(title=" ", description=statement)
      await ctx.send(embed=embedVar)
      await ctx.message.delete()
  
  @commands.command()
  async def deathmatch(self, ctx, member: discord.Member):
    challenger = ctx.author.id
    challengee = member.mention
    challenge = random.choice(deathmatches)
    statement = f"<@{challenger}> has challenged {challengee} to a deathmatch. The trial will be {challenge}."
    embedVar = discord.Embed(title=" ", description=statement)
    await ctx.send(embed=embedVar)
  
  @commands.command()
  async def roulette(self, ctx):
    embedLoading = discord.Embed(title=" ", description="Loading...")
    embedLoading.set_image(url="https://media1.tenor.com/images/69be09d0b37d5c4541bb2a01805ffabc/tenor.gif")
    await ctx.send(embed=embedLoading)
    user = ctx.author.id
    visual = random.choice(rouletteGIFS)
    choice = random.randint(1, 6)
    await asyncio.sleep(2)
    if choice > 1:
      embedVar = discord.Embed(title=" ", description=f"😰 <@{user}>, you survived... This time.")
      await ctx.send(embed=embedVar)
    else:
      await ctx.send(visual)
      await asyncio.sleep(2)
      embedVar = discord.Embed(title=" ", description=f"**BANG!** ⚰ <@{user}> died. RIP.")
      await ctx.send(embed=embedVar)