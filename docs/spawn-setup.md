# How to Spawn Pokémon with this tool (using a Base64 writer)

The custom ACE Pokemon builder tool will allow you to create any Pokemon with any data and spawn it inside your Pokemon Emerald game using the Base64 codes provided after clicking the Generate button. 
This feature is most useful for console users, as there are easier ways to copy Pokemon data on a computer with an emulator, such as copying the Hex data and pasting it into Pokeglitzer. 

When generating a Pokemon with the tool, you will see 14 box codes. After setting up the Base64 writer as shown below, the codes made from the tool will spawn that exact Pokemon into your PC after executing the code with a stable ACE species (0x410e recommended on english verison).



BASE64 writer 3.0 setup (by Mettrich):

- Use a stable Ace (like 0x410e) for the following codes.


Execute these 5 codes: (English only)
(If in doubt about O/0, it is always the uppercase "o"(O). If not written otherwise, I/1/l are always the uppercase "i"(I), but Box 6 has a "one"(1), as specified.)

Before executing these codes, as with any ACE code, make sure boxes 12-14 are empty (and last row of box 11). 

WELDR (Metang):

Code 1: (Bad egg should spawn in box 10, slot 22.)
Box  1:    B C U n _ F J u    [BCUn FJu]
Box  2:    I k o B 3 h F      [IkoB3hF]
Box  3:    A A T . h r        [AAT.hr]
Box  4:    A h _ f n          [Ah fn]
Box  5:    _ F Z O T . h r    [ FZOT.hr] ← upper case o (O)
Box  6:    J J J _ 1 / …      [JJJ 1/…] ← one (1)
Box  7:    P q / _ … n        [Pq/ …n] ← lowercase Q (q)
Box  8:    v 6 5 Q K          [v65QK]
Box  9:    T . g L _ F Z O    [T.gL FZO]
Box 10:    R j o D Y J m ?    [RjoDYJm?]
Box 11:    B n F K T F F F    [BnFKTFFF]
Box 12:    U U F R R G O U    [UUFRRGOU]
Box 13:    T H S G Q U R L    [THSGQURL]
Box 14:    Q T R R U U F F    [QTRRUUFF]
For old emulators:
Box  8:    v 8 5 Q K          [v85QK]


Code 2: (no visible change after execution)
Box  8:    v I 5 Q K          [vI5QK]
Box 11:    B n R G J I F F    [BnRGJIFF]
Box 12:    H G G T M N F G    [HGGTMNFG]
Box 13:    I I T T H T F T    [IITTHTFT]
Box 14:    S R Q Q I T F G    [SRQQITFG]
For old emulators:
Box  8:    v K 5 Q K          [vK5QK]
All the other boxes stay the same!



Code 3: (no visible change after execution)
Box  8:    v X 5 Q K          [vX5QK]
Box 11:    B n S K N L H F    [BnSKNLHF]
Box 12:    J T I L G H S J    [JTILGHSJ]
Box 13:    Q U F G Q U G O    [QUFGQUGO]
Box 14:    F L I G F N H O    [FLIGFNHO]
For old emulators:
Box  8:    v Z 5 Q K          [vZ5QK]
All the other boxes stay the same!



Code 4: (Bad egg should now be a in a nest ball)
Box  8:    v m 5 Q K          [vm5QK]
Box 11:    B n F J S Q F N    [BnFJSQFN]
Box 12:    I O I T F F R T    [IOITFFRT]
Box 13:    J F G L M F F G    [JFGLMFFG]
Box 14:    I H T Q T M        [IHTQTM]
For old emulators:
Box  8:    v o 5 Q K          [vo5QK] ← lowercase "O"(o)
All the other boxes stay the same!



Code 5: (After executing, the bad egg in Box 10 Slot 22 should have turned into a Metang called "WELDR".)
Box  8:    v ♀ 5 Q K          [v♀5QK]
Box 11:    B n F F S F Q K    [BnFFSFQK]
Box 12:    H I P H I L P I    [HIPHILPI]
Box 13:    F H T F G R U U    [FHTFGRUU]
Box 14:    H U T G            [HUTG]
For old emulators:
Box  8:    v , 5 Q K          [v,5QK]
All the other boxes stay the same!


Last step:

Catch any Pokemon, and give it the nickname depending on your game:
- Emerald: J-FKVC
- FR/LG: J7VC
- R/S: ♀7VC

Put it in position S (slot 29 box 14)
Put WELDR in Posistion W (slot 28 box 14)

Box 14 should look like this:
- - - - - -
- - - - - -
- - - - - -
- - - - - -
- - - W S -

You are now ready to execute BASE64 codes!



To execute the code correctly:
- Make sure only Weldur and the nicknamed Pokemon is in box 14, and that boxes 11-13 are empty. (If you're using the old stable ace (0x40e9), or any other stable THUMB species, you need your bootstrap bad egg in box 12).
- After entering the code for your Pokemon given by the tool, save the game. Execute the code by viewing the summary of the stable ace species (0x410e). It doesn't matter where you keep your stable ace when executing the code, as long as its not in boxes 11-14, and you don't need to be any specific place in the game. Wait around 1 second after going into the summary, then close it. Your Pokemon will spawn in slot 30 of box 14.

Issues and how to solve them:
    With the right setup, the codes will work 100% of the time. If your code isn't working, simply attempting again without changing anything will give you the exact same result. You need to change something before attempting agian.

- If your Pokemon becomes a bad egg, you have typed something wrong. Soft reset the game, and carefully check all lowercase + uppercase letters. Watch out for the zero (0) and O, they look exactly the same in-game. 
- If your Pokemon's name/OT or other data seem wrong, it's also likely a small mistake in the written code in your boxes. Soft reset and find the mistake(s). Save and execute the code again.
- If your game crashes/freezes as you execute a Base64 code:
    - the WELDR may have been generated with wrong code, or your nicknamed Pokemon was nicknamed wrong, or they were placed in the wrong slot. There should not be any other Pokemon in boxes 11-14. 
    - If you are using a Metstable ace species, you need to execute the code by viewing the summery of any adjacent Pokemon to the metastable species, scroll to the stats page, then scroll down or up into the metastable species to execute the code. After about 1 second, you may close the summary and look for your generated Pokemon in box 14, slot 30.

If you don't see the issue, attempt to clear ghost data in boxes 11-14:

Ghost data can appear if you recently traded to gen 4, or if you didn't clear ghost data properly in the Glitzer Popping step for the Dots egg when you first set up ace on your save file. The reason it stops the code from working, is simply because the code requires boxes 11-14 to be empty (except for WELDR and the nicknamed Pokemon). The game reads the ghost data as there being "something" in the boxes, stopping the code from working.

1. Temporarily move WELDR and the nicknamed Pokemon to box 1 or anywhere outside of 11-14. 
2. Find a box that is full, and press the "Select" button to enter multi-select option. Hold "A" from the top left corner, and move your glove to the opposite corner and let go of the A button to grab the entire box. 
3. Move the Pokemon by using the left or right button and move them to box 11. Put them down to override any ghost data in that box. Repeat for boxes 12, 13 and 14. Move the Pokemon back to where they were, and put WELDR and the nicknamed Pokemon back to their position in box 14. 
4. Save the game, and attempt to execute the code again.

- Your troubleshooting should be like this: 
1. If code doesn't work (either by getting a bad egg or wrong data on the Pokemon), reset the game to last save.
2. Find a mistake in the code. Fix it and save the game. 
3. Execute the code again. If there are still issues, repeat the process from step 1. 

Good luck! Ask me on my Discord server if you need help! 
discord.com/invite/rjQGPhG7e3
- MankeyMite