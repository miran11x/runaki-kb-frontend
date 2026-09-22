import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
 
const RK_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNzE2LjAwMDAwMCAxNzE2LjAwMDAwMCI+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDE3MTYuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjRDJBRDU0IiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNzA4MyAxNjc1MCBjLTEwNSAtNjQgLTExNCAtMTE3IC0xMjMgLTcxMCAtNSAtMjcyIC0xMSAtNTA0IC0xNAotNTE1IC0xNCAtNDkgLTY5IC0yODggLTgzIC0zNjAgLTEyIC02MiAtMTggLTE5MSAtMjMgLTU3NSAtOCAtNTI4IC03IC01MTYKLTY4IC03NzAgLTE2IC02OSAtMzcgLTE2MSAtNDcgLTIwNSAtNjUgLTI5OSAtMTk2IC0zMjEgLTUzMiAtODggLTYyIDQzIC0xNzcKMTIyIC0yNTUgMTc2IC03OSA1NCAtMjYwIDE4MCAtNDAzIDI3OSAtNDkyIDM0MCAtMTU0MCAxMDM1IC0xNjI1IDEwNzcgLTEwNgo1MiAtMTcxIDYxIC0yMTggMzIgLTg1IC01NCAtNzIgLTE3NiA1MyAtNDk1IDM1IC04OSA3OCAtMjA0IDk1IC0yNTYgMTggLTUyCjcyIC0xODcgMTIwIC0zMDAgNDggLTExMyAxMDMgLTI1MiAxMjIgLTMxMCA0MyAtMTI2IDExOSAtMzI5IDIzNSAtNjIwIDQ3Ci0xMTggMTA1IC0yNzEgMTI4IC0zNDAgMjQgLTY5IDYzIC0xNzIgODggLTIzMCAyMDQgLTQ3OSAyMjcgLTYwMCAxMzcgLTcwMwotNTEgLTU3IC04OCAtNjggLTI1NiAtNzQgLTE3OSAtNyAtMzA1IDggLTUwMyA1OCAtMTA4IDI3IC0xOTUgNDIgLTI4MyA0OSAtNzEKNiAtMTg1IDE0IC0yNTUgMjAgLTg0IDYgLTE2OCAyMCAtMjQzIDQwIC0xNzkgNDggLTI2MCA2MCAtNDY3IDcwIC0xOTYgMTAKLTI2NSAyMSAtNDIxIDY0IC0xNTAgNDEgLTE5MSA0NyAtNDMyIDU3IC0xMjkgNSAtMjUzIDEyIC0yNzQgMTUgLTEyOCAxOCAtMjI0Ci0yOSAtMjEyIC0xMDUgMTYgLTEwNCA4MCAtMTc2IDc1MSAtODQ1IDYwMyAtNjAzIDY5MyAtNjg3IDkxNSAtODU2IDI1NSAtMTk1CjU1MyAtNDc2IDYxOSAtNTg1IDk5IC0xNjMgMzYgLTI4OSAtMjEyIC00MjUgLTMyMyAtMTc3IC00NDEgLTI1MSAtNjkyIC00MzEKLTg1IC02MCAtMTk1IC0xNzEgLTE5NSAtMTk1IDAgLTc0IDM3NSAtMjEgODExIDExNSA1MyAxNiAxNTAgNDEgMjE1IDU2IDY1IDE0CjE5MyA0NiAyODQgNzAgOTEgMjQgMjMwIDU3IDMxMCA3NCA4MCAxNyAxOTYgNDQgMjU3IDYwIDYyIDE3IDE3OCAzOSAyNTcgNTEKODAgMTEgMjA1IDM2IDI3OCA1NCAxNjggNDQgMjE3IDUyIDQwOCA3MCAxMDggMTAgMTk4IDI2IDI5NSA1MSA3NyAyMCAyMTIgNDkKMzAwIDY1IDIzNiA0MCAyOTcgNzYgMjgxIDE2NSAtMTcgODggLTEwNyAxNDQgLTcyMSA0NTIgLTEzOTUgNjk5IC0xNzUzIDkxNAotMTYyMiA5NzQgNDEgMTggMjk5IC0zMCA1MzcgLTEwMCA1MiAtMTYgMTI0IC0zNiAxNjAgLTQ2IDk2IC0yNSAxMTY3IC0zODMKMTY1MCAtNTUxIDM1MCAtMTIxIDQ4NyAtMTI4IDUzMCAtMjQgMzIgNzggLTcgMTgyIC0xNjIgNDI1IC01MiA4MyAtMTA5IDE3NgotMTI2IDIwOCAtMTEwIDIwMCAtMTAzIDE4OCAtMjIwIDM2NyAtNzAgMTA2IC0xMDcgMTY3IC0yMzYgMzg1IC0yNiA0NCAtNzAKMTE2IC05OCAxNjAgLTI3IDQ0IC05MSAxNDggLTE0MSAyMzAgLTQ5IDgzIC0xMTggMTk1IC0xNTIgMjUwIC0zNCA1NSAtOTUgMTU5Ci0xMzUgMjMwIC00MSA3MiAtMTA2IDE4MiAtMTQ2IDI0NiAtMTI4IDIwNiAtMTg0IDMzMiAtMTg0IDQyMCAwIDE3OCAyNTcgMTAKNTU0IC0zNjEgMzcgLTQ3IDEwMCAtMTI1IDEzOSAtMTc1IDE0MiAtMTc3IDE0NTEgLTE0OTMgMTU3MCAtMTU3OCAxNDQgLTEwMwoyMTUgLTEwNCAyNTQgLTYgMTYgNDAgMTggMTA1IDIxIDY0OSA0IDY3OSAtMSA3NzUgLTUyIDk4NiAtNjEgMjUyIC02MSAyNDYKLTYxIDc5NCAwIDM5OSA0IDU0OCAxOCA3MTAgOSAxMTMgMTggMjM2IDIwIDI3NCAzIDg4IDE2IDkyIDU2IDE2IDE4IC0zMyA0OAotODEgNjcgLTEwNiA3NiAtOTkgMTU0IC0yNzYgMjQ3IC01NTkgMTAzIC0zMTMgMjkzIC04OTUgNDIyIC0xMjkwIDY0IC0xOTgKMTIwIC0zNzEgMTI1IC0zODUgNSAtMTQgMzQgLTEwOCA2NSAtMjEwIDIxNCAtNjk3IDI4OCAtODIzIDQ0MiAtNzQ5IDY2IDMyCjEwOSAxMDkgMjI4IDQxOSAzNSA5MSA4OSAyMzAgMTIwIDMxMCAzMSA4MCAxMDEgMjc4IDE1NSA0NDAgMTEwIDMyOCAxMzYgNDAzCjIwMyA1NzAgOTcgMjQzIDE3MyA0NDUgMjY4IDcxOSAxMjQgMzU0IDE4MyA0ODEgMjYwIDU2MCA3MiA3MiAxMDYgNTkgMTM0IC01Mwo0NSAtMTgyIDM5IC0zNDAgLTIwIC01NjggLTIxIC04NCAtMzggLTE3OSAtNDUgLTI1NCAtNSAtNjUgLTE0IC0xNzMgLTIwIC0yMzkKLTYgLTc4IC0yNCAtMTc2IC01MCAtMjgwIC00MCAtMTU4IC00MyAtMTgxIC03MCAtNTMwIC02IC04NiAtMjAgLTE2OSAtNDAKLTI0NSAtNDMgLTE2NCAtNTggLTI1MSAtNzAgLTQyMyAtNiAtODQgLTE2IC0xODYgLTIxIC0yMjcgLTQ4IC0zNDggMTMgLTQzMwoyMzMgLTMyOCAxMjYgNjEgMjM5IDE2MSA3MzcgNjU3IDUxNiA1MTQgNTc3IDU3MCA3OTYgNzMwIDE1NSAxMTQgMjcwIDIxNSA1MTUKNDU1IDQ4MiA0NzIgNjgzIDU5MyA2NDIgMzg0IC0zNiAtMTc5IC0xNjkgLTM5NyAtMTA3OSAtMTc2NSAtNjAzIC05MDYgLTYzMgotOTU0IC02NDAgLTEwNTcgLTEzIC0xNjEgMTAyIC0xNzggNDcyIC03MSA4MyAyNCAyMDQgNTggMjcwIDc1IDEzOSAzNiAyMzggNjUKNTM1IDE2MCAyNzYgODggNDEwIDEyNyA2NTAgMTkwIDEwNyAyOSAyOTIgODMgNDEwIDEyMiAxMTggMzggMjM3IDc2IDI2MyA4NQoyNyA4IDEyNiAzNCAyMjAgNTggOTUgMjQgMTk3IDUwIDIyNyA1OSAxNTUgNDQgNDM5IDk4IDQ3NyA5MSA2NiAtMTMgNzEgLTE2Cjc3IC00MCAxNyAtNjcgLTc1IC0xNTggLTQxOSAtNDE2IC03OCAtNTggLTE3NCAtMTMzIC0yMTUgLTE2NyAtNDEgLTM0IC0xMjcKLTk3IC0xOTAgLTE0MCAtNjMgLTQzIC0xOTQgLTEzMiAtMjkwIC0xOTcgLTk2IC02NSAtMjI3IC0xNTcgLTI5MCAtMjA1IC02MwotNDcgLTE2MCAtMTE3IC0yMTUgLTE1NSAtNTUgLTM4IC0xMjkgLTkxIC0xNjQgLTExOCAtMTAzIC03OCAtOTEwIC02MTQgLTEwODYKLTcyMSAtODggLTU0IC0yMDkgLTEyOCAtMjcwIC0xNjYgLTYwIC0zOCAtMTM5IC04NiAtMTc0IC0xMDYgLTE0NSAtODQgLTI0MQotMTc2IC0yNDEgLTIzMCAwIC0xMTIgMTQ4IC0xNDMgNTAwIC0xMDQgMjI4IDI1IDQxMyAyNCA1OTUgLTQgMTYzIC0yNSAzNDMKLTM2IDU5MiAtMzYgMjg0IDAgMzgyIC0xMCA1NzcgLTYwIDgzIC0yMSAyMTYgLTQ4IDI5NiAtNTkgODAgLTEyIDIxNSAtNDAgMjk5Ci02MiA4NSAtMjIgMjIwIC01NCAzMDAgLTcwIDgxIC0xNiAxODUgLTQwIDIzMyAtNTQgMjM0IC02NyAzNjkgLTc0IDM5OCAtMjAKMjggNTMgLTYwIDE0MSAtMzEwIDMxMCAtMzUyIDIzOSAtNDc3IDMwNyAtNzkxIDQzMyAtMjI2IDkwIC0yNjcgMTExIC0zMjIgMTY2Ci04MiA4MiAtODQgMTcyIC03IDI4NiA1MyA3OCAyNzIgMjg2IDM5MyAzNzMgMjI2IDE2MyAyODYgMjEzIDQ2NSAzODQgMjQ4IDIzOAoyNTcgMjQ1IDQwNyAzNTMgMTg2IDEzNCAyMTkgMTYyIDQyNSAzNjAgMjEyIDIwMyAyNTQgMjQxIDM0OCAzMDcgMTY5IDEyMCAyNzIKMjAyIDM3MCAyOTcgNTkgNTYgMTQ5IDE0MSAyMDAgMTkwIDUxIDQ5IDEzMiAxMjEgMTgwIDE1OCAyOTggMjM2IDM3NCAzMjkgMzMzCjQwNyAtMzAgNTYgLTUzIDU3IC00MjEgMzIgLTM1MCAtMjMgLTQwNCAtMzAgLTU1MCAtNjYgLTIwOCAtNTIgLTIyNCAtNTQgLTQzNwotNjUgLTIwNCAtMTEgLTI2OCAtMjEgLTQ1MyAtNzAgLTc3IC0yMSAtMTU4IC0zNCAtMjQ1IC00MSAtNzEgLTUgLTE4NiAtMTQKLTI1NSAtMTkgLTg4IC03IC0xNzIgLTIyIC0yODUgLTUwIC0zMTQgLTgwIC01ODggLTgxIC02OTMgLTMgLTExNyA4NyAtMTE3CjE4OSAzIDQ3MyAyOSA2OSA5MCAyMjkgMTM1IDM1NSAxMjAgMzM0IDE2MiA0NDUgMjIzIDU4NSAzMCA2OSA4NCAyMDYgMTIwIDMwNQozNiA5OSA4NiAyMzAgMTEyIDI5MCA0NiAxMDkgMTY2IDQzMSAyMzAgNjE1IDE4IDUzIDU3IDE1NCA4NSAyMjUgODkgMjIyIDEwNgozMDcgNzYgMzc5IC01MiAxMjYgLTE4NiA4NSAtNTU2IC0xNjkgLTY5IC00NyAtMTg4IC0xMjggLTI2NSAtMTgxIC03NyAtNTIKLTIzNyAtMTYyIC0zNTUgLTI0NCAtNDk2IC0zNDMgLTE1MDYgLTEwMTQgLTE1ODIgLTEwNTAgLTEzOSAtNjggLTI0MyAtNTAKLTMxNSA1NCAtNzEgMTAzIC04MiAxOTcgLTgzIDY3MiAwIDQzMyAtNyA1MjEgLTU5IDc0NCAtMjIgOTEgLTQyIDE3OSAtNDYgMTk1Ci00IDE3IC0xMCAyNzMgLTE1IDU3MCAtOSA1OTkgLTkgNTk3IC04MCA4MDggLTcwIDIwNyAtMTA0IDI0NiAtMjA3IDIzOSAtNzAKLTUgLTIzMCAtMjEyIC0zNzEgLTQ3OCAtNzggLTE0NiAtMTI1IC0yMjcgLTIzNyAtMzk5IC0yOSAtNDQgLTYzIC0xMDAgLTc3Ci0xMjUgLTU0IC05NyAtODcgLTE1OCAtMTIxIC0yMjAgLTcxIC0xMzMgLTEzMSAtMjM2IC0xNjcgLTI5MCAtNTYgLTg0IC0xOTQKLTMxOCAtMjM1IC00MDEgLTQxIC04MSAtMjcwIC00NjkgLTM5MSAtNjU5IC0xMjAgLTE4OSAtMjc2IC0yMjQgLTM5OSAtODkgLTY5Cjc1IC05MCAxMDggLTE4OCAyODkgLTk3IDE4MCAtMTYzIDI5MyAtMjgyIDQ4NSAtNjMgMTAxIC0yMTUgMzcwIC0yMTUgMzgwIDAgNwotNzQgMTI4IC0xNzAgMjc1IC00OCA3NCAtMTA5IDE3NiAtMTM1IDIyNSAtMTA0IDE5NyAtMTQ3IDI3MSAtMzIzIDU1OCAtMzQgNTYKLTg4IDE0OSAtMTE5IDIwNyAtMTUzIDI4MyAtMjU4IDM3MyAtMzYwIDMxMHoiLz4KPHBhdGggZD0iTTc3NDMgNDUxMSBjLTczIC0xOCAtMTMxIC04MyAtMTYwIC0xNzYgLTMxIC0xMDIgLTI4IC0yMDM5IDQgLTIxNDAKNzQgLTIzNCAyNDIgLTM2MCA1MTMgLTM4NCAxODkgLTE2IDEyNjMgLTYgMTM0NSAxMyAyMDIgNDYgMzMzIDE2NSA0MjAgMzc4IDgxCjE5OCA5OSAzMzggOTMgNzI4IC02IDM1MCAtMjMgNDA4IC0xNDcgNDk1IC02NSA0NiAtMjM3IDQ2IC0zMDIgMCAtMTI5IC05MAotMTQwIC0xMzUgLTE0OSAtNTcwIC05IC00MjUgLTE5IC00NzEgLTEyMiAtNTc1IC0xMDEgLTEwMiAtMTk5IC0xMjUgLTUzMwotMTI0IC0zOTUgMCAtNTE5IDQ3IC02MDQgMjI4IC01NSAxMTUgLTU0IDk4IC02MCAxMDMxIC03IDk1NCAtNiA5MzEgLTY4IDEwMTMKLTUyIDcwIC0xNDcgMTA0IC0yMzAgODN6Ii8+CjxwYXRoIGQ9Ik02MjEyIDQ0MjYgYy03MSAtMzUgLTI4OCAtMjM3IC02NzUgLTYzMSAtMjU0IC0yNTkgLTMwNSAtNDc2IC0xNDcKLTYzMiA2NSAtNjYgMTA1IC03NCAzODUgLTgzIDMwNCAtMTAgNDUyIC0zNyA1OTEgLTEwOCAzMjMgLTE2NSAyODggLTY3MyAtNTUKLTc4NyAtMTA5IC0zNiAtODA1IC00NSAtMjAwMSAtMjUgLTU0MiA5IC01MTEgNiAtNzQ1IDcwIC0yNTggNzEgLTQyNiAyMiAtNDUxCi0xMzEgLTIwIC0xMjEgNjggLTIwNiAzMDMgLTI5NSA2NSAtMjUgMTQwIC01OSAxNjggLTc1IDI1NiAtMTU2IDE0OCAtMzk4Ci0yMjMgLTUwMiAtMTIxIC0zMyAtNTk4IC0zMyAtNzIyIDEgLTM3NyAxMDMgLTUwMCAyOTIgLTQ3MCA3MTggMTkgMjYyIC0xMwozNTQgLTE0NSA0MTUgLTE1NSA3MiAtMjkzIC0yNCAtMzY4IC0yNTYgLTg5IC0yNzcgLTk5IC00NDIgLTM5IC02MTUgMTM4IC0zOTIKNDI5IC02MTAgODY3IC02NTAgNjYgLTYgMTgzIC0yMSAyNjAgLTMyIDgyIC0xMyAxODggLTIyIDI1NSAtMjIgNjcgMCAxNzMgOQoyNTUgMjIgNzcgMTEgMTk0IDI2IDI2MCAzMiAyMTQgMjAgMzcyIDczIDUxMiAxNzIgMTgxIDEyOCAyMzkgMjIxIDI5NyA0ODQgMjcKMTI0IDUyIDE3MiAxMTcgMjI3IDEwMSA4NyAxMzUgODkgMTI0NCA4NiA4NTMgLTIgOTM1IC0xIDk5MCAxNCAxOTIgNTUgMzIxCjE4NCAzODIgMzgyIDI3IDkwIDI3IDY2MCAwIDc1MCAtNzkgMjU1IC0yODYgNDIyIC02MzggNTE1IC0zMDUgODAgLTMyMiAxNzcKLTgzIDQ4NSAxMzggMTc3IDE2OCAyMzUgMTY5IDMyMCAxIDE2MiAtMTI5IDIyOSAtMjkzIDE1MXoiLz4KPHBhdGggZD0iTTk2MjkgNDM1NyBjLTIyNyAtODUgLTE2NiAtNDEyIDc3IC00MTEgMTY5IDEgMjU4IDE5MCAxNTggMzM1IC00OAo2OSAtMTU3IDEwNSAtMjM1IDc2eiIvPgo8cGF0aCBkPSJNMTExNjUgMzQ2OSBjLTM5MyAtMzggLTY3MiAtMzAxIC03MTUgLTY3NCAtNTQgLTQ3MyA1OSAtNzc0IDM0NgotOTIyIDEwMSAtNTIgMTgyIC03MCAzNzIgLTgyIDE3MyAtMTAgMjI5IC0yOSAyNjkgLTkwIDM2IC01MyAzMCAtODcgLTIwIC0xMzYKLTg0IC04MCAtMTY1IC0xMDQgLTM0NyAtMTA1IC0yMTYgMCAtMzEwIC01NyAtMzEwIC0xODggMCAtMTE3IDExMiAtMTc3IDM0OQotMTg4IDM2OCAtMTYgNTg5IDQyIDc3OSAyMDYgMjI1IDE5NSAyNDggMjk3IDIzOSAxMDYzIC03IDU4OSAtMTQgNjMzIC0xMjMKNzk1IC0xODYgMjc0IC00MTcgMzYzIC04MzkgMzIxeiBtMjM1IC00NTAgYzIzNCAtMTA2IDMyNCAtNTU0IDE1MSAtNzUxIC0xNjEKLTE4NCAtNTE3IC0yNSAtNTk2IDI2NSAtNzkgMjkxIDIwMSA1OTcgNDQ1IDQ4NnoiLz4KPHBhdGggZD0iTTEzMzE1IDM0NzAgYy0xNzkgLTI0IC0zMzUgLTEyOCAtNDg2IC0zMjMgLTI4NCAtMzY3IC0yOTEgLTc1MSAtMjIKLTExMDUgMTM3IC0xNzkgMjU5IC0yMzUgNTQ4IC0yNTEgMTkxIC0xMCAyMzYgLTIyIDI4NSAtNzcgMTAxIC0xMTUgLTUxIC0yMzYKLTMyMCAtMjU2IC0xNzIgLTEyIC0yMjYgLTM0IC0yNTkgLTEwMCAtOTggLTIwMyAxMzYgLTMxMSA1ODQgLTI2OSAzNzMgMzQgNjM3CjI0MSA3MjcgNTY5IDI2IDkxIDQwIDkzMiAxOSAxMTA3IC02MCA1MDYgLTQ4MiA3ODIgLTEwNzYgNzA1eiBtMzY3IC00NjIgYzE0NAotNzcgMjM5IC0yNzggMjI1IC00NzcgLTMxIC00NDQgLTU4OSAtNDgzIC02OTIgLTQ4IC04NyAzNzAgMTg0IDY3NiA0NjcgNTI1eiIvPgo8cGF0aCBkPSJNMTUzMDMgMzQzMSBjLTcxIC0xOCAtMTI5IC04MSAtMTU5IC0xNzEgLTE2IC01MCAtMTkgLTExNSAtMjQgLTcwNQotNiAtNTY3IC04IC02NTcgLTIzIC03MDggLTM1IC0xMjEgLTkyIC0xOTcgLTIxNCAtMjg2IC0xODggLTEzOCAtMjMwIC0yNTMKLTE0MCAtMzg0IDU0IC03OSA5OSAtMTAwIDIxOSAtMTA1IDMxMyAtMTMgNTQ0IDE2MiA2MTUgNDY4IDI4IDExNyAyNyAxNjI0IDAKMTcxNSAtNDIgMTM1IC0xNTMgMjA2IC0yNzQgMTc2eiIvPgo8cGF0aCBkPSJNMTQ4MDUgNjY1IGMtODggLTg3IDM5IC00MDYgMTk0IC00ODUgMTM5IC03MSAzMzkgOTUgMzY1IDMwMyAxOCAxMzkKLTIzIDE3NyAtMTg5IDE3NyAtNjEgMCAtMTM3IDcgLTE3MCAxNSAtOTcgMjMgLTE3MSAyMCAtMjAwIC0xMHoiLz4KPC9nPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCwxNzE2LjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIKZmlsbD0iIzNGM0YzRiIgc3Ryb2tlPSJub25lIj4KPHBhdGggZD0iTTg5NTAgODk4OSBjLTQxIC01IC0xNDkgLTI3IC0yNDAgLTQ5IC0yMjMgLTU0IC0yOTAgLTYwIC02OTUgLTYwCi00MDQgMCAtNDY2IC02IC02NzkgLTU5IC0xODYgLTQ3IC0yOTYgLTYxIC00ODggLTYxIC0xODUgMCAtMjcyIC0xMSAtNDY2IC02MQotMTI4IC0zMyAtMTkxIC00MyAtMzQyIC01NSAtMTk3IC0xNiAtMjU3IC0yNiAtNDQwIC03NCAtMTEwIC0yOSAtMTU5IC0zNgotMzg1IC02MCAtNTUgLTYgLTE3NCAtMjkgLTI2NCAtNTEgLTkxIC0yMiAtMjI4IC01MSAtMzA1IC02NCAtNzggLTEzIC0xOTAKLTM3IC0yNTEgLTU0IC02MCAtMTYgLTE3NSAtNDEgLTI1NSAtNTUgLTgwIC0xNCAtMTk3IC0zOSAtMjYwIC01NiAtNjMgLTE3Ci0xODkgLTQ4IC0yODAgLTcwIC05MSAtMjEgLTIwMyAtNTAgLTI1MCAtNjQgLTQ3IC0xMyAtMTUwIC00MSAtMjMwIC02MSAtMzkzCi05OCAtMTE3MiAtMzUzIC0xNDMwIC00NjggLTM1NiAtMTU5IC0zNzEgLTE2NyAtMzk0IC0yMDEgLTIwIC0zMSAtMjAgLTI4IDQKLTU2IDMzIC0zOCA5NCAtNDEgMjQ5IC0xMiAxMjkgMjQgMTU2IDI1IDUzMSAyNyA0MjkgMiA0MTMgMCA2NjUgNjggMTM1IDM3CjI2NSA0NyA1OTMgNDcgMzQ5IDAgNDE0IDYgNjI3IDYwIDIxNCA1NCAyNzcgNjAgNzE1IDYwIDQzMCAwIDUwMyA2IDY5NiA1NSA3NwoxOSAxNjIgNDAgMTg5IDQ2IDMxIDcgMjc1IDE0IDYzMCAxOSA1MjcgNyA1OTAgOSA2OTUgMjkgMTU1IDI4IDIyNyAyOCAyNzEgLTIKODkgLTYwIDY5IC0xMzkgLTc1IC0zMTIgLTQyIC00OSAtMTExIC0xMzcgLTE1MyAtMTk0IC0yMDYgLTI3NSAtMjU2IC0zNDEKLTMwOCAtNDAxIC0yNjggLTMxNCAtNDQ2IC02NDcgLTQwMSAtNzUzIDQ0IC0xMDcgMTM3IC05OSA3MDYgNTggMTI5IDM2IDMxNgo4NSA0MTUgMTEwIDk5IDI1IDIzOSA2MSAzMTIgODAgMTI5IDM0IDE5OSA0NyA0MTAgODAgNTYgOSAxNDggMjkgMjA0IDQ1IDU3CjE3IDE3OCA0MSAyNjkgNTUgOTEgMTQgMjM3IDQzIDMyNSA2NSAxNTkgMzkgMjIwIDQ5IDQxMCA3MSA1NSA2IDE2NyAyOCAyNTAKNTAgMTQ5IDM5IDE3NCA0MiA1MjAgNjggOTQgNyAxNzMgMjEgMjg2IDUwIDE5MSA0OSAyODUgNjEgNDk5IDYxIDIwOSAwIDMwNwoxMiA1MDAgNjAgMjE0IDUzIDI5NCA2MCA3MzAgNjAgNDExIDAgNTIwIDggNjYzIDQ2IDI2NiA3MiAxNzQgNjYgMTIwMiA3NSA1MTIKNCA5NTAgMTAgOTc1IDEzIDI1OSAzNiAzMjggNjAgMzMwIDExNCAxIDUwIC0yNDQgMTczIC00MzIgMjE3IC05MiAyMiAtMjQwIDYyCi0yOTQgODAgLTY0IDIxIC0xODYgNDMgLTMzNCA2MCAtNzQgOCAtMjA4IDMzIC0yOTcgNTUgLTE5NSA0OCAtMjk0IDYwIC01MTYKNjAgLTIxOCAwIC0zMjIgMTIgLTUxMiA2MCAtMjQzIDYxIC0yNDYgNjIgLTE2NDAgNTcgLTEwODQgLTMgLTEyNjkgLTYgLTEzMjUKLTE5IC0zNiAtOCAtMTIzIC0zMCAtMTk1IC00OSAtMzY4IC05NiAtNjIwIC0xIC01MjQgMTk4IDIxIDQzIDEyNSAxNDUgMjM5CjIzNSAzMCAyMyAxMDYgODggMTY3IDE0NCA2MiA1NiAxNTkgMTMzIDIxNSAxNzIgMzA4IDIxMyAzOTYgMzM1IDMxNiA0MzcgLTI4CjM2IC05MSA2MiAtMTgzIDc0IC05MSAxMyAtODU1IDEyIC05NjUgMHoiLz4KPC9nPgo8L3N2Zz4=";
const HP_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4OTYuODUgNTU1Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE2LjA5MDE2Miw2ODIuMDM2MTgzKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjRkY2QjM1IiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNjQ1MyA2ODAxIGMtMjYgLTEyIC01MSAtMzQgLTY2IC01OCAtNTggLTkxIC0xMjQgLTIxMiAtMTQ2IC0yNjMKLTEzIC0zMCAtNjQgLTEwOSAtMTE0IC0xNzQgLTQ5IC02NiAtMTEyIC0xNjMgLTEzOCAtMjE1IC0yNiAtNTMgLTU3IC0xMTIgLTY4Ci0xMzEgLTExIC0xOSAtMzcgLTcxIC01OSAtMTE1IC0yMSAtNDQgLTYzIC0xMjUgLTkzIC0xODAgLTUwIC05MiAtNzMgLTEyNwotMTgwIC0yNzAgLTIxIC0yOCAtNTIgLTgyIC02OSAtMTIwIC0xNyAtMzkgLTQ2IC05NSAtNjMgLTEyNSAtMTggLTMwIC00NiAtODcKLTYzIC0xMjcgLTE4IC0zOSAtNDMgLTg3IC01NiAtMTA1IC0xNCAtMTggLTQ2IC03MSAtNzIgLTExOCAtMjUgLTQ3IC03NSAtMTI1Ci0xMTEgLTE3NSAtMTM2IC0xODkgLTE4MSAtMzQxIC0xMzQgLTQ0NSA2OCAtMTUyIDE3OCAtMTI5IDI3MSA1NSAyMiA0NCA0OCA5MQo1OCAxMDUgMTAgMTQgMzIgNTkgNDkgMTAwIDE4IDQxIDQ5IDk3IDcwIDEyNSAxMDQgMTQwIDEzMCAxNzcgMTc4IDI2NSAyOSA1Mgo4MCAxNDkgMTE0IDIxNSAxMTYgMjI5IDE2NCAzMTMgMjQ2IDQyMyA0NSA2MCA5OSAxNDcgMTIxIDE5MyAyMSA0NiA1MCAxMDIgNjMKMTI0IDE0IDIyIDM4IDY5IDUzIDEwNSAxNSAzNiAzOCA3OSA1MSA5NiAxMyAxNyA2MCA4OSAxMDQgMTYwIDQ0IDcxIDEwMCAxNjEKMTI1IDE5OSA2NyAxMDQgMTQ2IDI5MCAxNDYgMzQzIDAgMTExIC0xMDMgMTY0IC0yMTcgMTEzeiIvPgo8cGF0aCBkPSJNNzMwNSA2ODA4IGMtNDIgLTE1IC03MSAtNDMgLTEyMiAtMTE4IC01NCAtODEgLTEwNCAtMTUwIC0xNTMgLTIxNQotMjEgLTI3IC01OCAtOTMgLTgzIC0xNDUgLTI1IC01MiAtNTUgLTExMSAtNjYgLTEzMCAtMTEgLTE5IC0zNSAtNjYgLTU0IC0xMDUKLTQ0IC05MiAtMTEzIC0yMDcgLTIxNCAtMzU4IC00NiAtNjcgLTEwNSAtMTY3IC0xMzEgLTIyMiAtMjcgLTU1IC02MCAtMTE4Ci03NCAtMTQwIC0xMyAtMjIgLTM3IC02OSAtNTIgLTEwNSAtMTUgLTM2IC0zOCAtNzggLTUwIC05NSAtMTMgLTE2IC02NSAtOTcKLTExNSAtMTgwIC01MSAtODIgLTEwNiAtMTY5IC0xMjIgLTE5MSAtMTYgLTIzIC00OCAtODQgLTcyIC0xMzUgLTI0IC01MiAtNTUKLTExMiAtNjggLTEzNCAtMTQgLTIyIC0zOCAtNzAgLTUzIC0xMDYgLTE2IC0zNyAtNDUgLTg3IC02NSAtMTEyIC0xMDcgLTEzMgotMTM4IC0xODUgLTMwMyAtNTA3IC0xMTAgLTIxNCAtMTE5IC0zMzggLTI3IC0zODUgOTYgLTUwIDIwNyAyNSAyODQgMTkwIDIzCjQ5IDUzIDEwOCA2NiAxMzAgMTQgMjIgMzggNjkgNTMgMTA1IDE1IDM2IDQyIDg4IDYwIDExNSAxOCAyOCA1MiA4MiA3NCAxMjAKMjMgMzkgNzAgMTEzIDEwNiAxNjUgMzYgNTIgODggMTQwIDExNCAxOTUgMjcgNTUgNjAgMTE4IDczIDE0MCAxNCAyMiAzNyA2OQo1MiAxMDYgMTUgMzYgNDQgODYgNjUgMTExIDEwNyAxMzIgMTM5IDE4NiAyOTcgNDkzIDM5IDc3IDc5IDE1NCA4NyAxNzAgOSAxNwoyOCA1NSA0MiA4NSAxNSAzMCA2MyAxMDAgMTA3IDE1NSA1NCA2NiA5NyAxMzQgMTI5IDIwMCAyNyA1NSA1OCAxMTYgNjkgMTM1CjExIDE5IDM3IDcxIDU5IDExNSA3MSAxNDYgMTQ1IDI3OSAxNzcgMzIwIDEwOCAxMzggMTM2IDIxNiAxMDAgMjg0IC0yNyA1MgotMTE1IDc1IC0xOTAgNDl6Ii8+CjxwYXRoIGQ9Ik04MTYwIDY4MTMgYy01OSAtOCAtNzYgLTE3IC0xMzggLTc2IC01MiAtNTAgLTczIC04MCAtMTA3IC0xNTIgLTIzCi00OSAtNTMgLTEwOCAtNjYgLTEzMCAtMTQgLTIyIC0zNSAtNjUgLTQ4IC05NSAtMTMgLTMwIC00MiAtODQgLTY2IC0xMjAgLTIzCi0zNiAtNTAgLTgwIC02MCAtOTkgLTkgLTE4IC01OSAtOTggLTExMCAtMTc2IC01MiAtNzggLTExMSAtMTc5IC0xMzIgLTIyNgotMjIgLTQ2IC01MSAtMTAyIC02NCAtMTI0IC0xNCAtMjIgLTM4IC02OSAtNTMgLTEwNSAtMTUgLTM2IC00NCAtODcgLTY1IC0xMTUKLTEwNiAtMTQxIC0xODggLTI3NiAtMjkwIC00ODAgLTE0MyAtMjg1IC0xODYgLTM1NiAtMjk5IC00OTAgLTE0IC0xNiAtNDQgLTcwCi02NyAtMTIwIC0yMyAtNDkgLTUzIC0xMDggLTY2IC0xMzAgLTE0IC0yMiAtMzcgLTY5IC01MyAtMTA1IC0xNSAtMzYgLTQwIC04MwotNTUgLTEwNSAtMTUgLTIyIC00NyAtNzQgLTcwIC0xMTUgLTIzIC00MSAtNzMgLTEyMCAtMTExIC0xNzUgLTM4IC01NSAtOTIKLTE0NSAtMTE4IC0yMDAgLTI3IC01NSAtNjAgLTExOCAtNzQgLTE0MCAtMTMgLTIyIC0zNiAtNjkgLTUyIC0xMDUgLTE1IC0zNgotNDAgLTgxIC01NiAtMTAxIC0xNDUgLTE4MiAtMTYzIC0zMjYgLTQ4IC0zODUgMTI1IC02NSAyNDggNjcgNDY4IDUwMSAxMTcKMjMxIDE2NiAzMTMgMjQ3IDQyMiA0NCA2MCAxMDEgMTUyIDEyNiAyMDQgMjUgNTIgNTUgMTEwIDY2IDEyOSAxMSAxOSAzNSA2Nwo1NCAxMDUgNDYgOTYgMTE3IDIxNSAyMTQgMzU4IDQ2IDY3IDEwNyAxNzIgMTM3IDIzMiAzMCA2MSA2NCAxMjYgNzUgMTQ1IDExCjE5IDM3IDY5IDU2IDExMCAyMCA0MSA2NiAxMjMgMTAzIDE4MiAzNyA1OCA4NSAxMzUgMTA2IDE3MCAyMiAzNCA1MiA3OSA2NyA5OQoxNiAyMCA0OCA3OCA3MiAxMzAgMjQgNTIgNTUgMTEyIDY4IDEzNCAxNCAyMiAzNyA3MCA1MyAxMDcgMTUgMzYgNDIgODMgNjAKMTA1IDkyIDExMCAxNTAgMjA1IDI5NCA0ODMgMzUgNjkgNzcgMTUwIDkzIDE4MCA4NyAxNjggNDYgMjkwIC05MSAyNzN6Ii8+CjxwYXRoIGQ9Ik04OTM1IDY3OTYgYy01NSAtMjUgLTE0MSAtMTI1IC0xNzggLTIwNiAtMTkgLTQyIC00NiAtODkgLTU5IC0xMDUKLTM1IC00MSAtMTUwIC0yMjAgLTE3OCAtMjc1IC0xMyAtMjUgLTM2IC02NCAtNTEgLTg3IC0xNiAtMjMgLTQ4IC04NCAtNzIKLTEzNSAtMjQgLTUxIC01NSAtMTExIC02OCAtMTMzIC0xNCAtMjIgLTM2IC02NSAtNDggLTk1IC0xMyAtMzAgLTYyIC0xMDcKLTExMCAtMTcwIC03NiAtMTAyIC0xNjUgLTI1MyAtMjM3IC00MDUgLTc4IC0xNjMgLTE2NyAtMzE3IC0yNTcgLTQ0MiAtNDcgLTY3Ci0xMDQgLTE1OSAtMTI1IC0yMDUgLTIxIC00NSAtNTAgLTEwMSAtNjMgLTEyMyAtMTQgLTIyIC0zOCAtNjkgLTUzIC0xMDUgLTE1Ci0zNiAtMzggLTc4IC01MCAtOTUgLTEzIC0xNiAtNjUgLTk3IC0xMTUgLTE4MCAtNTEgLTgyIC0xMDYgLTE2OSAtMTIyIC0xOTEKLTE2IC0yMyAtNDggLTg0IC03MiAtMTM1IC0yNCAtNTIgLTU1IC0xMTIgLTY4IC0xMzQgLTE0IC0yMiAtMzcgLTY3IC01MSAtMTAxCi0xNCAtMzMgLTYzIC0xMTIgLTEwOSAtMTc1IC04OSAtMTIyIC0xNTggLTI0MCAtMjQwIC00MDggLTI4IC01OCAtNjIgLTEyNQotNzcgLTE1MCAtMTUgLTI1IC0zOSAtNzQgLTU0IC0xMDggLTE0IC0zNSAtNDcgLTg5IC03MiAtMTIxIC0xNDIgLTE3OSAtMTYxCi0yMjMgLTE1NCAtMzU2IDUgLTk4IDI1IC0xNDIgNzUgLTE2MiA4NCAtMzUgMTE4IDAgMzIzIDMzNiA0NiA3NCA5OCAxNTcgMTE3CjE4NCAxOSAyNyA1NCA5MCA3NyAxNDAgMjQgNTAgNTQgMTA5IDY3IDEzMSAxNCAyMiAzNyA2NyA1MSAxMDEgMTQgMzMgNjMgMTEyCjEwOCAxNzUgOTIgMTI2IDE2MiAyNDYgMjQ1IDQxNyAzMSA2MiA2NiAxMjkgNzggMTUwIDEzIDIwIDM2IDY3IDUyIDEwNCAxNSAzNwo0MiA4NSA1OSAxMDUgMTAyIDEyMiAxNDkgMjAwIDI4NSA0NjkgMzEgNjAgNjUgMTIzIDc3IDE0MCAxMSAxNiAzOCA2MSA1OSA5OQoyMSAzOSA3NiAxMjYgMTIyIDE5MyA0NiA2OCAxMDMgMTY1IDEyOCAyMTUgMjQgNTEgNTMgMTA4IDY0IDEyNyAxMSAxOSAzNSA2Nwo1NCAxMDUgNDMgODkgMTEwIDIwMiAyMTQgMzU3IDQ2IDY4IDEwNyAxNzMgMTM3IDIzMyAzMCA2MSA2NCAxMjYgNzUgMTQ1IDEyCjE5IDM0IDY0IDUxIDEwMCAxNiAzNiA2NiAxMTUgMTEwIDE3NSAxMjQgMTY4IDIzOCAzODYgMjQ3IDQ2OSAxMSAxMDggLTE2IDE0NgotMTA0IDE0NiAtMzIgLTEgLTcxIC03IC04OCAtMTR6Ii8+CjxwYXRoIGQ9Ik0xOTE2IDU0MSBjLTI0IC0yNiAtMjMgLTEwMiAxIC0xNDQgMzAgLTUwIDU5IC02MCAxMjQgLTQxIDU5IDE4IDE0OQoxNSAyMzIgLTggNjAgLTE2IDc3IDAgNzcgNzIgMCA3MSAtMTcgODggLTc0IDcyIC0xMDQgLTI3IC0xNzggLTE2IC0yNDYgNDAKLTQxIDMzIC04OSAzNyAtMTE0IDl6Ii8+CjxwYXRoIGQ9Ik01OTUgNDg3IGMtNjggLTY2IC02OCAtNjggMSAtMTM0IDY2IC02MSA4OCAtNjUgMTMwIC0yMiA2MSA2MyAyNAoyMDkgLTUzIDIwOSAtMTUgMCAtNDQgLTIwIC03OCAtNTN6Ii8+CjxwYXRoIGQ9Ik0xODQgNDc2IGMtNTEgLTM4IC0xMCAtMTQwIDQ1IC0xMTIgNTIgMjcgNjcgNTMgNDUgNzcgLTMzIDM3IC02OCA1MAotOTAgMzV6Ii8+CjwvZz4KPC9zdmc+";
 
 
const ORANGE = '#FF6B35';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const GREEN = '#10b981';
const AMBER = '#f59e0b';
const CARD_BG = 'linear-gradient(145deg,#0f1623,#111827)';
const PAGE_BG = '#0a0f1a';
const TEXT = '#F4F6F5';
const MUTED = '#8b98a6';
const BORDER = 'rgba(255,255,255,0.08)';
 
function BookIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function GridIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function GlobeIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}
function UsersIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a20.7 20.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
function CheckIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color || '#fff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
 
function StatCard({ icon, color, num, label, live }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: CARD_BG, border: `1px solid ${color}25`, borderRadius: '14px', padding: '12px 12px', minWidth: 0 }}>
      <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '90px', height: '90px', background: `radial-gradient(circle,${color}22 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', border: `1.5px solid ${color}45`, boxShadow: `0 0 10px ${color}30, inset 0 0 8px ${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle,${color}18,transparent)`, flexShrink: 0 }}>
          {icon}
        </div>
        {live && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', fontWeight: 800, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}`, animation: 'pulse 2s infinite' }} />
            Live
          </div>
        )}
      </div>
      <div style={{ fontSize: '17px', fontWeight: 800, color: TEXT, marginTop: '10px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{num}</div>
      <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{label}</div>
      <div style={{ position: 'absolute', bottom: 0, left: '18%', right: '18%', height: '2px', background: `linear-gradient(90deg,transparent,${color}90,transparent)`, borderRadius: '2px' }} />
    </div>
  );
}
 
export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [focused, setFocused] = useState('');
  const [stats, setStats] = useState({ totalFAQs: null, totalCategories: null, totalUsers: null });
 
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
 
  useEffect(() => {
    api.get('/public/stats').then(res => setStats(res.data)).catch(() => {});
  }, []);
 
  const handleSubmit = async e => {
    e.preventDefault();
    const res = await login(form.identifier, form.password);
    if (!res.ok) { toast.error(res.error); return; }
    if (res.mfaRequired) { navigate('/mfa', { state: { challengeToken: res.challengeToken } }); return; }
    toast.success('Welcome back!');
    navigate('/');
  };
 
  const statBlocks = [
    { icon: <BookIcon color={BLUE} />, color: BLUE, num: stats.totalFAQs != null ? `${stats.totalFAQs}+` : '—', label: 'Topics' },
    { icon: <GridIcon color={PURPLE} />, color: PURPLE, num: stats.totalCategories != null ? String(stats.totalCategories) : '—', label: 'Categories' },
    { icon: <GlobeIcon color={AMBER} />, color: AMBER, num: 'EN / KU / AR', label: 'Languages' },
    { icon: <UsersIcon color={GREEN} />, color: GREEN, num: stats.totalUsers != null ? String(stats.totalUsers) : '—', label: 'Agents', live: true },
  ];
 
  const features = [
    { t: 'Role-based access control', c: BLUE },
    { t: 'Bilingual EN / Kurdish content', c: PURPLE },
    { t: 'Daily tips from your team lead', c: AMBER },
    { t: 'Real-time update notifications', c: GREEN },
  ];
 
  const waveColors = [ORANGE, BLUE, PURPLE, GREEN, AMBER];
 
  return (
    <>
      <style>{`
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        @keyframes wave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes drift { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px,-20px); } }
      `}</style>
 
      <div style={S.page}>
        <div style={{ ...S.wrapper, flexDirection: isMobile ? 'column' : 'row' }}>
 
          {/* Left — branding panel */}
          <div style={{ ...S.left, display: isMobile ? 'none' : 'flex' }}>
            <div style={{ ...S.blob, top: '-120px', left: '-100px', background: `radial-gradient(circle,${BLUE}30,transparent 70%)`, animationDelay: '0s' }} />
            <div style={{ ...S.blob, bottom: '-140px', right: '-80px', background: `radial-gradient(circle,${PURPLE}25,transparent 70%)`, animationDelay: '2s' }} />
            <div style={S.dotGrid} />
 
            <div style={S.leftInner}>
              <div style={S.leftTop}>
                <h1 style={S.headline}>Agent Knowledge Base</h1>
 
                <p style={S.desc}>
                  Everything you need mid-call, in one place — verified scripts,
                  FAQs and procedures for Runaki's Sorani, Badini and Arabic queues,
                  kept current by your QA team.
                </p>
 
 
                <div style={S.stats}>
                  {statBlocks.map((s, i) => <StatCard key={i} {...s} />)}
                </div>
 
                <div style={S.features}>
                  {features.map(f => (
                    <div key={f.t} style={S.featureItem}>
                      <span style={{ ...S.featureCheck, background: `${f.c}20`, boxShadow: `0 0 8px ${f.c}40` }}><CheckIcon color={f.c} /></span>
                      <span>{f.t}</span>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Live call waveform */}
              <div style={S.waveform} aria-hidden="true">
                {[...Array(40)].map((_, i) => {
                  const c = waveColors[i % waveColors.length];
                  return (
                    <span
                      key={i}
                      style={{
                        ...S.waveBar,
                        background: c,
                        boxShadow: `0 0 6px ${c}80`,
                        height: `${14 + (i % 7) * 7}px`,
                        animationDelay: `${(i % 8) * 0.1}s`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
 
          {/* Right — form */}
          <div style={S.right}>
            <div style={{ ...S.blob, top: '-100px', right: '-100px', background: `radial-gradient(circle,${ORANGE}20,transparent 70%)`, animationDelay: '1s' }} />
            <div style={S.dotGrid} />
 
            <div style={S.formCard}>
              <div style={S.formLogos}>
                <img src={RK_LOGO} alt="Runaki" style={S.formLogo} />
                <div style={S.formLogoDivider} />
                <div style={S.hpLockup}>
                  <img src={HP_ICON} alt="" style={S.hpIcon} />
                  <span style={S.hpText}>HIGH-PERFORMANCE</span>
                </div>
              </div>
 
              <div style={S.statusRow}>
                <span style={S.statusDot} />
                <span>System online</span>
              </div>
 
              <h2 style={S.formTitle}>Sign in</h2>
              <p style={S.formSub}>Use your Runaki KB account to continue</p>
 
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '10px' }}>
                <div style={S.field}>
                  <label style={S.label}>Email or Wave ID</label>
                  <div style={{ position: 'relative' }}>
                    <span style={S.fieldIco}><UserIcon /></span>
                    <input
                      type="text"
                      placeholder="you@runaki.com"
                      value={form.identifier}
                      onChange={e => setForm({ ...form, identifier: e.target.value })}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      style={{ ...S.input, ...(focused === 'email' ? S.inputOn : {}) }}
                      required
                    />
                  </div>
                </div>
 
                <div style={S.field}>
                  <label style={S.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={S.fieldIco}><LockIcon /></span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused('pass')}
                      onBlur={() => setFocused('')}
                      style={{ ...S.input, paddingRight: '44px', ...(focused === 'pass' ? S.inputOn : {}) }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={S.eyeBtn}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
 
                <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.85 : 1 }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                        <span style={S.spinner} /> Signing in...
                      </span>
                    : 'Sign in'
                  }
                </button>
              </form>
 
              <div style={S.hint}>Use your company credentials to sign in.</div>
            </div>
          </div>
 
        </div>
      </div>
    </>
  );
}
 
const S = {
  page: { width: '100vw', height: '100vh', background: PAGE_BG, fontFamily: "'Inter','Segoe UI',sans-serif", overflow: 'hidden' },
  wrapper: { display: 'flex', width: '100%', height: '100%' },
 
  left: { flex: '1.15', position: 'relative', background: `linear-gradient(160deg,#0d1420,#0a0f1a)`, overflow: 'hidden', borderRight: `1px solid ${BORDER}` },
  leftInner: { position: 'relative', zIndex: 1, height: '100%', padding: '56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '36px', boxSizing: 'border-box', overflow: 'hidden' },
  leftTop: { display: 'flex', flexDirection: 'column' },
 
  blob: { position: 'absolute', width: '360px', height: '360px', borderRadius: '50%', filter: 'blur(10px)', animation: 'drift 12s ease-in-out infinite', pointerEvents: 'none' },
  dotGrid: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '26px 26px', pointerEvents: 'none' },
 
 
  headline: { fontSize: '38px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.08, color: TEXT, marginTop: '26px', marginBottom: 0 },
  desc: { color: MUTED, fontSize: '14.5px', lineHeight: 1.6, maxWidth: '420px', marginTop: '12px' },
 
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '22px' },
 
  features: { display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '22px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: TEXT, opacity: 0.95 },
  featureCheck: { width: '22px', height: '22px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
 
  waveform: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px', marginTop: '16px', opacity: 0.85 },
  waveBar: { width: '4px', borderRadius: '2px', animation: 'wave 1.6s ease-in-out infinite', transformOrigin: 'bottom' },
 
  right: { flex: '1', position: 'relative', background: `linear-gradient(160deg,#0e1620,#0a0f1a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  formCard: { position: 'relative', zIndex: 1, width: '100%', maxWidth: '410px', animation: 'fadeUp 0.45s ease', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '24px', padding: '40px 38px', boxShadow: '0 32px 90px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' },
 
  formLogos: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '22px', marginBottom: '28px' },
  formLogo: { height: '72px', width: 'auto', display: 'block', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))' },
  hpLockup: { display: 'flex', alignItems: 'center', gap: '10px' },
  hpIcon: { height: '46px', width: 'auto', display: 'block', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.45))' },
  hpText: { fontSize: '15px', fontWeight: 800, letterSpacing: '0.04em', color: '#E4E7EA', lineHeight: 1.1, whiteSpace: 'nowrap' },
  formLogoDivider: { width: '1px', height: '46px', background: BORDER },
 
  statusRow: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11.5px', fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' },
  statusDot: { width: '7px', height: '7px', borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}`, animation: 'pulse 2s infinite', display: 'inline-block' },
 
  formTitle: { fontSize: '27px', fontWeight: 800, color: TEXT, letterSpacing: '-0.01em', margin: 0 },
  formSub: { color: MUTED, fontSize: '14px', marginTop: '6px', marginBottom: '4px' },
 
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: MUTED, fontWeight: 500 },
  fieldIco: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: MUTED, display: 'flex', pointerEvents: 'none' },
  input: { width: '100%', boxSizing: 'border-box', background: '#151d27', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px 12px 42px', color: TEXT, fontSize: '14.5px', outline: 'none', transition: 'border-color .15s, box-shadow .15s' },
  inputOn: { borderColor: ORANGE, boxShadow: `0 0 0 3px ${ORANGE}25` },
  eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '4px', display: 'flex' },
 
  btn: { marginTop: '4px', padding: '13px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${ORANGE},#ff9a6c)`, color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'opacity .15s', boxShadow: `0 8px 24px ${ORANGE}40` },
  spinner: { width: '16px', height: '16px', border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 },
 
  hint: { marginTop: '22px', textAlign: 'center', fontSize: '12.5px', color: MUTED, lineHeight: 1.6 },
};