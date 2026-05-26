# Base64 Code Troubleshooting

This page is a troubleshooting guide for the most common problems with Base64 codes.

## Common problems

- [Bad egg instead of a Pokemon](#problem-bad-egg)
- [Game crashes or freezes](#problem-game-crashes-or-freezes)
- [Untypable code for Nintendo Switch](#problem-untypable-code-switch)
- [Other problems](#problem-other-problems)

<a id="problem-bad-egg"></a>
## Bad egg instead of a Pokemon

If you executed the Base64 code and ended up with a Bad Egg in Box 14, Slot 30, the most likely cause is a small typo in the code. This happens when the Pokémon’s checksum does not match the data in its structure, causing the game to treat it as invalid and display it as a Bad Egg. Reset the game and compare each box to the code from the website for a mistake. 

Another reason for a bad egg is that you have other Pokemon inside the execution area of the PC (last row of box 11 to box 14 slot 30 for Ruby, Sapphire, Emerald, and second row of box 13 to box 14 slot 30 in Fire Red / Leaf Green). You may also have ghost data in here, so if you have already double checked the code, enter the multiselect option with the select button (GBA/DS) or Y for the Switch, and hold down A while scrolling from one corner to the other and let go to pick up the box of pokemon, and drop them into the execution zone to overwrite any ghost data that might be interfering with the code. Make sure to remove the Pokémon from these boxes after, save the game, and retry the code.

You should also make sure the pokemon next to the Base64 writer has the correct nickname for your game. For the non-japanese languages, this would be J-FKVC for Emerald, J7VC for Fire Red/Leaf Green, and ♀7VC for Ruby or Sapphire.

The final reason is that your Base64 writer is not set up correctly. Maybe you typed something wrong while creating it, resulting in the base64 format being translated incorrectly, creating wrong data on the Pokémon. If you have already made sure the 14 boxes are typed correct, and cleaned the boxes for potential ghost data, creating a new Base64 writer would be your final option. Make sure to do the test code after creating it, to ensure it is working, although it is unknown if it is possible that the test code might succeed while the Base64 writer is slightly wrong.


<a id="problem-game-crashes-or-freezes"></a>
## Game crashes or freezes

If your game is freezing, it could be because of other Pokémon in the execution area of the PC (last row of box 11 to box 14 slot 30 for Ruby, Sapphire, Emerald, and second row of box 13 to box 14 slot 30 in Fire Red / Leaf Green). You may have ghost data in here, so if you have already double checked the code, enter the multiselect option with the select button (GBA/DS) or Y for the Switch, and hold down A while scrolling from one corner to the other and let go to pick up the box of pokemon, and drop them into the execution zone to overwrite any ghost data that might be interfering with the code. Make sure to remove the Pokémon from these boxes after, save the game, and retry the code.

<a id="problem-untypable-code-switch"></a>
## Untypable code for Nintendo Switch

If you encounter a code that your Nintendo Switch 1/2 will not allow into your box name, it is because of the profanity filter on the Switch, detecting a potential bad word. What I would prefer you do in this case, is first send me a message on Discord and tell me which box name you are not able to type in, and I will include the word into the website's own filter and make future codes with that word split itself in two, if possible. Here is how you can adjust the code yourself:

If you think you know what part of the code is triggering the profanity filter, you may attempt to split and push the code forward, by ending the code for that box early, and pushing the remaining code forward. Here is an example: 

Box names (BASE64):
  Box 1:  (4t6Sdjkw)
  Box 2:  (MdTEw8HB)
  Box 3:  (xtPKz8DA)
  Box 4:  (AgLH1eLf)
  Box 5:  (2e3?AOXm) 
  Box 6:  (AADe7qOi) 
  Box 7:  (2!6jovvu) 
  Box 8:  (o6Lb5yOD) 
  Box 9:  (JBFcndvu)  <--- Let's assume "cnd" was a bad word here. I will then split the code, ending it on the next to last letter of that word, pushing everything forward. See next code.
  Box 10: (o6L87rOi) 
  Box 11: (29uvoiSo) 
  Box 12: (o6Lb7qOi) 
  Box 13: (2!6jotvu) 
  Box 14: (o6I) 


Code has been split and pushed:


  Box names (BASE64):
  Box 1:  (4t6Sdjkw)
  Box 2:  (MdTEw8HB)
  Box 3:  (xtPKz8DA)
  Box 4:  (AgLH1eLf)
  Box 5:  (2e3?AOXm)
  Box 6:  (AADe7qOi) 
  Box 7:  (2!6jovvu) 
  Box 8:  (o6Lb5yOD) 
  Box 9:  (JBFcn)     <--- Notice how the box ends without using spaces at the end. this is important, or else the code will stop here. 
  Box 10: (dvuo6L8) 
  Box 11: (7rOi29uv)
  Box 12: (oiSoo6Lb)
  Box 13: (7qOi2!6j)
  Box 14: (otvuo6I)   <--- As a result, everything after box 9 is shifted forward. 


   Be mindful of the available spaces in box 14. You may not split a box further than the 4th letter of the box, as that would result in box 14 getting more than 8 characters, which is impossible. If the word is within the first four characters of a box, this method will not work.


When splitting cannot fix it, especially if the blocked word starts in the first 4 characters of a box or appears in Box 14, you may swap certain Base64 letters for equivalent symbols. The code’s substitution map is:


Base64 letter -> symbol
A	. (period)
B	- (dash)
D	… (ellipsis)
E	“ (left double quote)
F	” (right double quote)
G	‘ (left single quote)
H	’ (right single quote)
I	♂ (male sign)
J	♀ (female sign)
L	, (comma)
N	/ (slash)


In the rare case that the bad word does not contain any of these letters, you have to adjust some info on the Pokemon to change the code.

<a id="problem-other-problems"></a>
## Other problems

If you have any other problems with the code, or some other issue, let me know! Contact me on my Discord server or send a PM on Discord @MankeyMite. 
Invitation link to my server: discord.com/invite/rjQGPhG7e3