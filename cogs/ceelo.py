import asyncio
import random
from collections import defaultdict
import discord
from discord.ext import commands

class CeeloCog(commands.Cog):
  def __init__(self, client):
    self.client = client

  async def countdown(self, ctx, game_message):
    await asyncio.sleep(30)
    embedVar = discord.Embed(title="Cee-lo", description=f"Starting in 30 seconds! [Jump to start]({game_message.jump_url})", color=0xffa500)
    await ctx.send(embed=embedVar)
    await asyncio.sleep(15)
    embedVar = discord.Embed(title="Cee-lo", description=f"Starting in 15 seconds! [Jump to start]({game_message.jump_url})", color=0xff0000)
    await ctx.send(embed=embedVar)

  def cee_lo_outcome(self, roll):
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

  @commands.Cog.listener()
  async def on_ready(self):
    self.active_games = defaultdict(lambda: {'players': set(), 'game_running': False})

  @commands.command()
  async def roll(self, ctx):
      # Restrict the command to the specific channel
      allowed_channel_id = 814947576297160746
      if ctx.channel.id != allowed_channel_id:
          embedVar = discord.Embed(title="Cee-lo", description="Let's keep the game in the <#814947576297160746> channel :wink:", color=0xf449d3)
          await ctx.send(embed=embedVar)
          return
  
      channel = ctx.channel
      if self.active_games[channel]['game_running']:
          embedVar = discord.Embed(title="Cee-lo", description="A game is already in progress.", color=0xf449d3)
          await ctx.send(embed=embedVar)
          return
  
      self.active_games[channel]['game_running'] = True
      embedVar = discord.Embed(title=f"A game of Cee-lo hosted by {ctx.author.name}", description="A new Cee-lo game is about to start in 60 seconds, please react with 🎲 to participate in this round.", color=0xf449d3)
      game_message = await ctx.send(embed=embedVar)
      await game_message.add_reaction("🎲")
  
      def check(reaction, user):
          return user != self.client.user and str(reaction.emoji) == "🎲"
  
      countdown_task = asyncio.create_task(self.countdown(ctx, game_message))
  
      while True:
          try:
              reaction, user = await self.client.wait_for("reaction_add", timeout=60, check=check)
              if user not in self.active_games[channel]['players']:
                  self.active_games[channel]['players'].add(user)
          except asyncio.TimeoutError:
              break
  
          countdown_task.cancel()
  
      # Check if there are at least two players
      if not self.active_games[channel]['players'] or len(self.active_games[channel]['players']) < 2:
        embedVar = discord.Embed(title="Cee-lo", description=f"No one wanted the smoke from {ctx.author.mention}. Ending the game.", color=0xf449d3)
        await ctx.send(embed=embedVar)
        self.active_games[channel]['game_running'] = False
        return
      
      participant_mentions = ", ".join([player.mention for player in self.active_games[channel]['players']])
      embedVar = discord.Embed(title="Started a new game of Cee-lo", description=f"Number of participants: {len(self.active_games[channel]['players'])}", color=0xf449d3)
      embedVar.add_field(name="Participants", value=participant_mentions, inline=False)
      await ctx.send(embed=embedVar)
      await asyncio.sleep(2)
  
      winner = None
      max_rank = -1
      
      for player in self.active_games[channel]['players']:
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
          self.active_games[channel]['game_running'] = False
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
        
        self.active_games[channel]['game_running'] = False