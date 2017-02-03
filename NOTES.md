M7 (6 ?)  - balloonCover (~ 40-50'')   p. 16
M8 - kill the balloon           p. 17 
  -> (level 1 should appear in front of the game)

  M11 - set 3 (go to another and go back)

M14 - Intermezzo
M15 - Avoid the rain


> order of death blue, pink, yellow, red


## todos:

General
- test urls
  * http://y.s.ch

  // * http://y.s.c (1rst choice)
  // * http://ch.oi.ce (2nd choice)
  // * http://your.smartest.choice

Bugs
- fix accelerationIncludingGravity on android -> hopefully solved
- iOS get north (orientation) -> no way to do that whit the time we have
- recheck midi (some note on seems to don't trigger)

- recheck if `master.gain.value = value;` works

States
- go back to default values between states
- schedule state change 1 beat after (ok)

Global
- display background gifs (ok)

Wait
- remove test right on exit

Compass
- fix color order in compass (ok)

BalloonCover
- put back explode buttons (ok)
- no gif on ipod
- when cover is done, randomly kill some balloons

Kill the Balloons
- fix spawn interval (ok)
- control balloon size diversity (ok)
- default value to 0.15

Avoid the rain
- add volume for sines (ok)
- explode balloons on harmony change (ok)

@still todo
- show texts in games

--

M6 I want to play the gif 16468927...

=> if as a background of the compass it should be ok (but not a priority) if you want it alone it will be more complicated
=> ok done

bar 107 start balloon cover, and on M8 I want to play gif 16443246...

=> ok so we have (107 - M8 (118)) 11 bars to cover the screen with balloons 

then you explode the balloons manually during M8 ?
bar 122 start the Killingballoon with default value 0.15 

=> ok  done

and in this whole part, I wish I can change the balloon's size, it's very important :)

=> ok done 

M11 text "on tempo"

=> if time do it 

Bar 182, I will play coverballoon again, and Bar 197 would be the gif 1644 again

=> ok but now we have 15 bars to cover the screen (was 11 the first time)
=> my proposal is to go for ten bars of balloons covering the screen, and then randomly kill some balloons sometime to haves some activity on the screen during the remaining bars (which is not a priority) before you trigger the explosion of each color

=> ok done

M15 the avoid rain start
In which way the sample will be played in this scene? if they sounds more relax would be better. or I remake samples?

=> Do you speak about the sines ? 
=> If yes I added a gain so that you can control for their volume
=> ok done

M16 text "fly with the balloon avoid the rain"

=> ok but not a priority

(from here just for me)

M17 compass will be use again 

M18 avoid rain, change size of balloon

M19 killingballoonn

M21- M22 gif 16443246 then intermezzo score

=> as a background of the game ? (same problem as before) 
=> ok done

M23 show score. 

M24 ballon cover and score change.

now questions for you:

the last scene, "general scores", the yellow balloon is very small, maybe we fix this?

=> Ok I will try see what I can do for that 

can we play other gifs?

=> If we are speaking of background images, once it's done for one it's done for several
=> If you think of having only these images on the screen it's more a problem 
=> ok done

maybe we remove the level 1 and level 2, so I can play the game in different oder and part, because from M18 the music is too long, I need to play some game like killingballoon. that’s more interesting.

=> ok done
