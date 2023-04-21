import discord
from discord.ext import commands

class ReactionRolesCog(commands.Cog):
    def __init__(self, client):
        self.client = client

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        MESSAGE_ID = 808727603808174121
        roles_mapping = {
          '🎮': 801904350578212885,
          '📈': 807374276692279332,
          '🍿': 842414590952472608,
        }

        # Check if the reaction is on the correct message
        if payload.message_id != MESSAGE_ID:
          return

        # Get the guild and the member who reacted
        guild = self.client.get_guild(payload.guild_id)
        if guild is None:
          return

        member = guild.get_member(payload.user_id)
        if member is None or member.bot:
          return

        # Assign the role corresponding to the emoji (if there's a mapping for it)
        try:
            role_id = roles_mapping.get(payload.emoji.name)
            if role_id is not None:
                role = guild.get_role(role_id)
                if role is not None:
                    await member.add_roles(role)
                    print(f"Assigned role {role.name} to {member.display_name}")
        except discord.errors.Forbidden:
            print(f"Missing permissions to add the role to {member.display_name}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")