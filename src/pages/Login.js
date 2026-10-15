import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RK_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM3IiBoZWlnaHQ9IjM1IiB2aWV3Qm94PSIwIDAgMTM3IDM1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTEuNzg4MSAyMC41MTM0SDUwLjU1NDFWMjMuNzA4OUg0NlYxMS4wMDE3SDUyLjUwMjNDNTMuNzUwNCAxMS4wMDE3IDU0LjgzNzcgMTEuMTk2MyA1NS43NjIzIDExLjU4MjJDNTYuNjg4NyAxMS45Njk4IDU3LjQwMjkgMTIuNTI1NCA1Ny45MDMyIDEzLjI1MjNDNTguNDA1MyAxMy45NzkzIDU4LjY1NjMgMTQuODI2IDU4LjY1NjMgMTUuNzk0MUM1OC42NTYzIDE2LjcwMjQgNTguNDM3MSAxNy40OTQyIDU4LjAwMDQgMTguMTcyOUM1Ny41NjM4IDE4Ljg1MTYgNTYuOTMyNiAxOS4zODg5IDU2LjEwODggMTkuNzg4MUw1OC45NDQ1IDIzLjcwODlINTQuMDgyOEw1MS43ODYzIDIwLjUxMzRINTEuNzg4MVpNNTMuNjAxOSAxNC42OTQ2QzUzLjI5MjUgMTQuNDM1MSA1Mi44Mjk0IDE0LjMwMzYgNTIuMjEyNCAxNC4zMDM2SDUwLjU1MjNWMTcuMjgxMkg1Mi4yMTI0QzUyLjgyOTQgMTcuMjgxMiA1My4yOTI1IDE3LjE1MTUgNTMuNjAxOSAxNi44OTAzQzUzLjkxMTMgMTYuNjMwOCA1NC4wNjUxIDE2LjI2MzIgNTQuMDY1MSAxNS43OTI1QzU0LjA2NTEgMTUuMzIxNyA1My45MTEzIDE0Ljk1NDEgNTMuNjAxOSAxNC42OTQ2WiIgZmlsbD0iIzFBMjYyQiIvPgo8cGF0aCBkPSJNNjIuNDIwMiAyMi40MTk3QzYxLjI2MjIgMjEuMzY2NyA2MC42ODQxIDE5Ljg4OTYgNjAuNjg0MSAxNy45ODk5VjExSDY1LjIzODJWMTcuODYxOEM2NS4yMzgyIDE4Ljc5MzMgNjUuNDE1IDE5LjQ3MiA2NS43Njg2IDE5Ljg5NDZDNjYuMTIyMSAyMC4zMTg3IDY2LjYzMyAyMC41MyA2Ny4zMDMxIDIwLjUzQzY3Ljk3MzEgMjAuNTMgNjguNDgyMyAyMC4zMTg3IDY4LjgzNzYgMTkuODk0NkM2OS4xOTEyIDE5LjQ3MDQgNjkuMzY4IDE4Ljc5MzMgNjkuMzY4IDE3Ljg2MThWMTFINzMuODQ0M1YxNy45ODk5QzczLjg0NDMgMTkuODg5NiA3My4yNjYyIDIxLjM2NjcgNzIuMTA4MiAyMi40MTk3QzcwLjk1MDIgMjMuNDcyNyA2OS4zMzYyIDI0IDY3LjI2NiAyNEM2NS4xOTU4IDI0IDYzLjU4MTcgMjMuNDcyNyA2Mi40MjM3IDIyLjQxOTciIGZpbGw9IiMxQTI2MkIiLz4KPHBhdGggZD0iTTg5LjY2MzMgMTFWMjMuNzA3Mkg4NS45MjA3TDgwLjc4NjggMTcuOTM1VjIzLjcwNzJINzYuMzQ5NFYxMUg4MC4wOTM4TDg1LjIyNiAxNi43NzIyVjExSDg5LjY2MzNaIiBmaWxsPSIjMUEyNjJCIi8+CjxwYXRoIGQ9Ik05Ni4zNTgzIDIxLjQ5MzJMOTUuNDUxNCAyMy43MDg5SDkwLjgyMTNMOTYuNzI2MSAxMUgxMDEuMjAyTDEwNy4xMDcgMjMuNzA4OUgxMDIuMzk5TDEwMS40OTIgMjEuNDkzMkg5Ni4zNTgzWk0xMDAuMjM1IDE4LjQwNzRMOTguOTIzNSAxNS4yMTE5TDk3LjYxMTggMTguNDA3NEgxMDAuMjM1WiIgZmlsbD0iIzFBMjYyQiIvPgo8cGF0aCBkPSJNMTEzLjc2MSAxOS40OTUzTDExMi43MzggMjAuNTY2NlYyMy43MDcySDEwOC4yNjJWMTFIMTEyLjczOFYxNS42MTExTDExNy4xNzUgMTFIMTIyLjEzNEwxMTYuNzMxIDE2LjU5MDlMMTIyLjQwNSAyMy43MDcySDExNy4xMzhMMTEzLjc2MSAxOS40OTUzWiIgZmlsbD0iIzFBMjYyQiIvPgo8cGF0aCBkPSJNMTI4IDExSDEyMy40NDZWMjMuNzA3MkgxMjhWMTFaIiBmaWxsPSIjMUEyNjJCIi8+CjxwYXRoIGQ9Ik0zLjAwMTIxIDIyLjEyNTNDMy4wMDEyMSAyMi4xMjUzIDExLjY2MDggMTguMDg0NCAyNS42MDc0IDE4LjA1MThDMjIuNjgyOSAxOS43OTI5IDIyLjAxNDUgMjAuNzAxMSAyMi4wMTQ1IDIwLjcwMTFDMjIuMDE0NSAyMC43MDExIDMxLjU0MjMgMTkuNTAxOCAzNy43MTcgMjIuMTU0NUMzMS43MTkxIDIxLjYyMDYgMjIuMDI3OCAyMi40ODI3IDE1LjY0IDI0LjUwMDRDMTUuODAzNSAyMy44Njk4IDE3LjMxNiAyMS44MDA0IDE4LjgyMzYgMjAuNjE2OEMxOC44MjM2IDIwLjYxNjggNS41NzMyOSAyMS40NDMgMyAyMi4xMjUzIiBmaWxsPSIjMUEyNjJCIi8+CjxwYXRoIGQ9Ik0zOS41NjI1IDExLjY2NDVMMzEuMTY2OSAxMi43OTQyTDM0LjIxOTggNS40NDg1N0wyNy4xODUzIDkuODQ5MkwyNi41MDM1IDJMMjIuMjIxNiA4Ljc5NTk3TDE3LjkzNiAyTDE3LjI1NTQgOS44NDgwOEwxMC4yMTk3IDUuNDUwODJMMTMuMjc1IDEyLjc5NjRMNC44Nzk0MiAxMS42NjY4TDExLjA2NSAxNy4wNTU1TDQuMzg1MzUgMjAuMzc1OUM2LjIwNTQyIDE5LjY0MyA4LjM5NDgzIDE4LjkwMTEgMTAuOTIyMSAxOC4zMDg4QzEzLjE1MDMgMTcuNzg2MSAxNS4yMDA0IDE3LjQ4MjYgMTYuOTkyNiAxNy4zMDk1QzE2Ljc1ODkgMTcuMTk5MyAxNi41MjUyIDE3LjA4OCAxNi4yOTI3IDE2Ljk3NzlMOC40MTkwNSAxMy4yNDk0TDE3Ljg3MDYgMTYuMTk4OUwxMi42Njk1IDguMzAxMzlMMTkuNTIxMSAxNS4wMjU0TDE4LjgxMTUgNS41NTUzNUwyMi4wNDg0IDE0LjY5MDVMMjUuNjI4IDUuNTU0MjNMMjQuMTE3OSAxNC44MjY1TDMxLjc3IDguMjk5MTVMMjYuMzk5NCAxNS44ODUzTDM2LjAyMjkgMTMuMjQ2MUMzNC41MDE5IDE0LjAxNiAyOS40NjE5IDE3Ljc4OTUgMjUuODUzMiAxOS40MTkzQzI5LjIxNDkgMTguOTIwMiAzMy4yMDEzIDE5LjI4MzMgMzYuODY2OSAyMC44NjE1QzM0LjkwMTUgMTkuMjM3MiAzMi4xNTM5IDE4LjEwNDIgMzEuNDY0OCAxOC4wNTAyTDM5LjU2MjUgMTEuNjYzNFYxMS42NjQ1WiIgZmlsbD0iI0QyQUQ1MCIvPgo8L3N2Zz4K";
const RK_LOGO_DARK = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM3IiBoZWlnaHQ9IjM1IiB2aWV3Qm94PSIwIDAgMTM3IDM1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTEuNzg4MSAyMC41MTM0SDUwLjU1NDFWMjMuNzA4OUg0NlYxMS4wMDE3SDUyLjUwMjNDNTMuNzUwNCAxMS4wMDE3IDU0LjgzNzcgMTEuMTk2MyA1NS43NjIzIDExLjU4MjJDNTYuNjg4NyAxMS45Njk4IDU3LjQwMjkgMTIuNTI1NCA1Ny45MDMyIDEzLjI1MjNDNTguNDA1MyAxMy45NzkzIDU4LjY1NjMgMTQuODI2IDU4LjY1NjMgMTUuNzk0MUM1OC42NTYzIDE2LjcwMjQgNTguNDM3MSAxNy40OTQyIDU4LjAwMDQgMTguMTcyOUM1Ny41NjM4IDE4Ljg1MTYgNTYuOTMyNiAxOS4zODg5IDU2LjEwODggMTkuNzg4MUw1OC45NDQ1IDIzLjcwODlINTQuMDgyOEw1MS43ODYzIDIwLjUxMzRINTEuNzg4MVpNNTMuNjAxOSAxNC42OTQ2QzUzLjI5MjUgMTQuNDM1MSA1Mi44Mjk0IDE0LjMwMzYgNTIuMjEyNCAxNC4zMDM2SDUwLjU1MjNWMTcuMjgxMkg1Mi4yMTI0QzUyLjgyOTQgMTcuMjgxMiA1My4yOTI1IDE3LjE1MTUgNTMuNjAxOSAxNi44OTAzQzUzLjkxMTMgMTYuNjMwOCA1NC4wNjUxIDE2LjI2MzIgNTQuMDY1MSAxNS43OTI1QzU0LjA2NTEgMTUuMzIxNyA1My45MTEzIDE0Ljk1NDEgNTMuNjAxOSAxNC42OTQ2WiIgZmlsbD0iI0Y0RUZFMyIvPgo8cGF0aCBkPSJNNjIuNDIwMiAyMi40MTk3QzYxLjI2MjIgMjEuMzY2NyA2MC42ODQxIDE5Ljg4OTYgNjAuNjg0MSAxNy45ODk5VjExSDY1LjIzODJWMTcuODYxOEM2NS4yMzgyIDE4Ljc5MzMgNjUuNDE1IDE5LjQ3MiA2NS43Njg2IDE5Ljg5NDZDNjYuMTIyMSAyMC4zMTg3IDY2LjYzMyAyMC41MyA2Ny4zMDMxIDIwLjUzQzY3Ljk3MzEgMjAuNTMgNjguNDgyMyAyMC4zMTg3IDY4LjgzNzYgMTkuODk0NkM2OS4xOTEyIDE5LjQ3MDQgNjkuMzY4IDE4Ljc5MzMgNjkuMzY4IDE3Ljg2MThWMTFINzMuODQ0M1YxNy45ODk5QzczLjg0NDMgMTkuODg5NiA3My4yNjYyIDIxLjM2NjcgNzIuMTA4MiAyMi40MTk3QzcwLjk1MDIgMjMuNDcyNyA2OS4zMzYyIDI0IDY3LjI2NiAyNEM2NS4xOTU4IDI0IDYzLjU4MTcgMjMuNDcyNyA2Mi40MjM3IDIyLjQxOTciIGZpbGw9IiNGNEVGRTMiLz4KPHBhdGggZD0iTTg5LjY2MzMgMTFWMjMuNzA3Mkg4NS45MjA3TDgwLjc4NjggMTcuOTM1VjIzLjcwNzJINzYuMzQ5NFYxMUg4MC4wOTM4TDg1LjIyNiAxNi43NzIyVjExSDg5LjY2MzNaIiBmaWxsPSIjRjRFRkUzIi8+CjxwYXRoIGQ9Ik05Ni4zNTgzIDIxLjQ5MzJMOTUuNDUxNCAyMy43MDg5SDkwLjgyMTNMOTYuNzI2MSAxMUgxMDEuMjAyTDEwNy4xMDcgMjMuNzA4OUgxMDIuMzk5TDEwMS40OTIgMjEuNDkzMkg5Ni4zNTgzWk0xMDAuMjM1IDE4LjQwNzRMOTguOTIzNSAxNS4yMTE5TDk3LjYxMTggMTguNDA3NEgxMDAuMjM1WiIgZmlsbD0iI0Y0RUZFMyIvPgo8cGF0aCBkPSJNMTEzLjc2MSAxOS40OTUzTDExMi43MzggMjAuNTY2NlYyMy43MDcySDEwOC4yNjJWMTFIMTEyLjczOFYxNS42MTExTDExNy4xNzUgMTFIMTIyLjEzNEwxMTYuNzMxIDE2LjU5MDlMMTIyLjQwNSAyMy43MDcySDExNy4xMzhMMTEzLjc2MSAxOS40OTUzWiIgZmlsbD0iI0Y0RUZFMyIvPgo8cGF0aCBkPSJNMTI4IDExSDEyMy40NDZWMjMuNzA3MkgxMjhWMTFaIiBmaWxsPSIjRjRFRkUzIi8+CjxwYXRoIGQ9Ik0zLjAwMTIxIDIyLjEyNTNDMy4wMDEyMSAyMi4xMjUzIDExLjY2MDggMTguMDg0NCAyNS42MDc0IDE4LjA1MThDMjIuNjgyOSAxOS43OTI5IDIyLjAxNDUgMjAuNzAxMSAyMi4wMTQ1IDIwLjcwMTFDMjIuMDE0NSAyMC43MDExIDMxLjU0MjMgMTkuNTAxOCAzNy43MTcgMjIuMTU0NUMzMS43MTkxIDIxLjYyMDYgMjIuMDI3OCAyMi40ODI3IDE1LjY0IDI0LjUwMDRDMTUuODAzNSAyMy44Njk4IDE3LjMxNiAyMS44MDA0IDE4LjgyMzYgMjAuNjE2OEMxOC44MjM2IDIwLjYxNjggNS41NzMyOSAyMS40NDMgMyAyMi4xMjUzIiBmaWxsPSIjRjRFRkUzIi8+CjxwYXRoIGQ9Ik0zOS41NjI1IDExLjY2NDVMMzEuMTY2OSAxMi43OTQyTDM0LjIxOTggNS40NDg1N0wyNy4xODUzIDkuODQ5MkwyNi41MDM1IDJMMjIuMjIxNiA4Ljc5NTk3TDE3LjkzNiAyTDE3LjI1NTQgOS44NDgwOEwxMC4yMTk3IDUuNDUwODJMMTMuMjc1IDEyLjc5NjRMNC44Nzk0MiAxMS42NjY4TDExLjA2NSAxNy4wNTU1TDQuMzg1MzUgMjAuMzc1OUM2LjIwNTQyIDE5LjY0MyA4LjM5NDgzIDE4LjkwMTEgMTAuOTIyMSAxOC4zMDg4QzEzLjE1MDMgMTcuNzg2MSAxNS4yMDA0IDE3LjQ4MjYgMTYuOTkyNiAxNy4zMDk1QzE2Ljc1ODkgMTcuMTk5MyAxNi41MjUyIDE3LjA4OCAxNi4yOTI3IDE2Ljk3NzlMOC40MTkwNSAxMy4yNDk0TDE3Ljg3MDYgMTYuMTk4OUwxMi42Njk1IDguMzAxMzlMMTkuNTIxMSAxNS4wMjU0TDE4LjgxMTUgNS41NTUzNUwyMi4wNDg0IDE0LjY5MDVMMjUuNjI4IDUuNTU0MjNMMjQuMTE3OSAxNC44MjY1TDMxLjc3IDguMjk5MTVMMjYuMzk5NCAxNS44ODUzTDM2LjAyMjkgMTMuMjQ2MUMzNC41MDE5IDE0LjAxNiAyOS40NjE5IDE3Ljc4OTUgMjUuODUzMiAxOS40MTkzQzI5LjIxNDkgMTguOTIwMiAzMy4yMDEzIDE5LjI4MzMgMzYuODY2OSAyMC44NjE1QzM0LjkwMTUgMTkuMjM3MiAzMi4xNTM5IDE4LjEwNDIgMzEuNDY0OCAxOC4wNTAyTDM5LjU2MjUgMTEuNjYzNFYxMS42NjQ1WiIgZmlsbD0iI0QyQUQ1MCIvPgo8L3N2Zz4K";
const HP_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4OTYuODUgNTU1Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE2LjA5MDE2Miw2ODIuMDM2MTgzKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjRkY2QjM1IiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNNjQ1MyA2ODAxIGMtMjYgLTEyIC01MSAtMzQgLTY2IC01OCAtNTggLTkxIC0xMjQgLTIxMiAtMTQ2IC0yNjMKLTEzIC0zMCAtNjQgLTEwOSAtMTE0IC0xNzQgLTQ5IC02NiAtMTEyIC0xNjMgLTEzOCAtMjE1IC0yNiAtNTMgLTU3IC0xMTIgLTY4Ci0xMzEgLTExIC0xOSAtMzcgLTcxIC01OSAtMTE1IC0yMSAtNDQgLTYzIC0xMjUgLTkzIC0xODAgLTUwIC05MiAtNzMgLTEyNwotMTgwIC0yNzAgLTIxIC0yOCAtNTIgLTgyIC02OSAtMTIwIC0xNyAtMzkgLTQ2IC05NSAtNjMgLTEyNSAtMTggLTMwIC00NiAtODcKLTYzIC0xMjcgLTE4IC0zOSAtNDMgLTg3IC01NiAtMTA1IC0xNCAtMTggLTQ2IC03MSAtNzIgLTExOCAtMjUgLTQ3IC03NSAtMTI1Ci0xMTEgLTE3NSAtMTM2IC0xODkgLTE4MSAtMzQxIC0xMzQgLTQ0NSA2OCAtMTUyIDE3OCAtMTI5IDI3MSA1NSAyMiA0NCA0OCA5MQo1OCAxMDUgMTAgMTQgMzIgNTkgNDkgMTAwIDE4IDQxIDQ5IDk3IDcwIDEyNSAxMDQgMTQwIDEzMCAxNzcgMTc4IDI2NSAyOSA1Mgo4MCAxNDkgMTE0IDIxNSAxMTYgMjI5IDE2NCAzMTMgMjQ2IDQyMyA0NSA2MCA5OSAxNDcgMTIxIDE5MyAyMSA0NiA1MCAxMDIgNjMKMTI0IDE0IDIyIDM4IDY5IDUzIDEwNSAxNSAzNiAzOCA3OSA1MSA5NiAxMyAxNyA2MCA4OSAxMDQgMTYwIDQ0IDcxIDEwMCAxNjEKMTI1IDE5OSA2NyAxMDQgMTQ2IDI5MCAxNDYgMzQzIDAgMTExIC0xMDMgMTY0IC0yMTcgMTEzeiIvPgo8cGF0aCBkPSJNNzMwNSA2ODA4IGMtNDIgLTE1IC03MSAtNDMgLTEyMiAtMTE4IC01NCAtODEgLTEwNCAtMTUwIC0xNTMgLTIxNQotMjEgLTI3IC01OCAtOTMgLTgzIC0xNDUgLTI1IC01MiAtNTUgLTExMSAtNjYgLTEzMCAtMTEgLTE5IC0zNSAtNjYgLTU0IC0xMDUKLTQ0IC05MiAtMTEzIC0yMDcgLTIxNCAtMzU4IC00NiAtNjcgLTEwNSAtMTY3IC0xMzEgLTIyMiAtMjcgLTU1IC02MCAtMTE4Ci03NCAtMTQwIC0xMyAtMjIgLTM3IC02OSAtNTIgLTEwNSAtMTUgLTM2IC0zOCAtNzggLTUwIC05NSAtMTMgLTE2IC02NSAtOTcKLTExNSAtMTgwIC01MSAtODIgLTEwNiAtMTY5IC0xMjIgLTE5MSAtMTYgLTIzIC00OCAtODQgLTcyIC0xMzUgLTI0IC01MiAtNTUKLTExMiAtNjggLTEzNCAtMTQgLTIyIC0zOCAtNzAgLTUzIC0xMDYgLTE2IC0zNyAtNDUgLTg3IC02NSAtMTEyIC0xMDcgLTEzMgotMTM4IC0xODUgLTMwMyAtNTA3IC0xMTAgLTIxNCAtMTE5IC0zMzggLTI3IC0zODUgOTYgLTUwIDIwNyAyNSAyODQgMTkwIDIzCjQ5IDUzIDEwOCA2NiAxMzAgMTQgMjIgMzggNjkgNTMgMTA1IDE1IDM2IDQyIDg4IDYwIDExNSAxOCAyOCA1MiA4MiA3NCAxMjAKMjMgMzkgNzAgMTEzIDEwNiAxNjUgMzYgNTIgODggMTQwIDExNCAxOTUgMjcgNTUgNjAgMTE4IDczIDE0MCAxNCAyMiAzNyA2OQo1MiAxMDYgMTUgMzYgNDQgODYgNjUgMTExIDEwNyAxMzIgMTM5IDE4NiAyOTcgNDkzIDM5IDc3IDc5IDE1NCA4NyAxNzAgOSAxNwoyOCA1NSA0MiA4NSAxNSAzMCA2MyAxMDAgMTA3IDE1NSA1NCA2NiA5NyAxMzQgMTI5IDIwMCAyNyA1NSA1OCAxMTYgNjkgMTM1CjExIDE5IDM3IDcxIDU5IDExNSA3MSAxNDYgMTQ1IDI3OSAxNzcgMzIwIDEwOCAxMzggMTM2IDIxNiAxMDAgMjg0IC0yNyA1MgotMTE1IDc1IC0xOTAgNDl6Ii8+CjxwYXRoIGQ9Ik04MTYwIDY4MTMgYy01OSAtOCAtNzYgLTE3IC0xMzggLTc2IC01MiAtNTAgLTczIC04MCAtMTA3IC0xNTIgLTIzCi00OSAtNTMgLTEwOCAtNjYgLTEzMCAtMTQgLTIyIC0zNSAtNjUgLTQ4IC05NSAtMTMgLTMwIC00MiAtODQgLTY2IC0xMjAgLTIzCi0zNiAtNTAgLTgwIC02MCAtOTkgLTkgLTE4IC01OSAtOTggLTExMCAtMTc2IC01MiAtNzggLTExMSAtMTc5IC0xMzIgLTIyNgotMjIgLTQ2IC01MSAtMTAyIC02NCAtMTI0IC0xNCAtMjIgLTM4IC02OSAtNTMgLTEwNSAtMTUgLTM2IC00NCAtODcgLTY1IC0xMTUKLTEwNiAtMTQxIC0xODggLTI3NiAtMjkwIC00ODAgLTE0MyAtMjg1IC0xODYgLTM1NiAtMjk5IC00OTAgLTE0IC0xNiAtNDQgLTcwCi02NyAtMTIwIC0yMyAtNDkgLTUzIC0xMDggLTY2IC0xMzAgLTE0IC0yMiAtMzcgLTY5IC01MyAtMTA1IC0xNSAtMzYgLTQwIC04MwotNTUgLTEwNSAtMTUgLTIyIC00NyAtNzQgLTcwIC0xMTUgLTIzIC00MSAtNzMgLTEyMCAtMTExIC0xNzUgLTM4IC01NSAtOTIKLTE0NSAtMTE4IC0yMDAgLTI3IC01NSAtNjAgLTExOCAtNzQgLTE0MCAtMTMgLTIyIC0zNiAtNjkgLTUyIC0xMDUgLTE1IC0zNgotNDAgLTgxIC01NiAtMTAxIC0xNDUgLTE4MiAtMTYzIC0zMjYgLTQ4IC0zODUgMTI1IC02NSAyNDggNjcgNDY4IDUwMSAxMTcKMjMxIDE2NiAzMTMgMjQ3IDQyMiA0NCA2MCAxMDEgMTUyIDEyNiAyMDQgMjUgNTIgNTUgMTEwIDY2IDEyOSAxMSAxOSAzNSA2Nwo1NCAxMDUgNDYgOTYgMTE3IDIxNSAyMTQgMzU4IDQ2IDY3IDEwNyAxNzIgMTM3IDIzMiAzMCA2MSA2NCAxMjYgNzUgMTQ1IDExCjE5IDM3IDY5IDU2IDExMCAyMCA0MSA2NiAxMjMgMTAzIDE4MiAzNyA1OCA4NSAxMzUgMTA2IDE3MCAyMiAzNCA1MiA3OSA2NyA5OQoxNiAyMCA0OCA3OCA3MiAxMzAgMjQgNTIgNTUgMTEyIDY4IDEzNCAxNCAyMiAzNyA3MCA1MyAxMDcgMTUgMzYgNDIgODMgNjAKMTA1IDkyIDExMCAxNTAgMjA1IDI5NCA0ODMgMzUgNjkgNzcgMTUwIDkzIDE4MCA4NyAxNjggNDYgMjkwIC05MSAyNzN6Ii8+CjxwYXRoIGQ9Ik04OTM1IDY3OTYgYy01NSAtMjUgLTE0MSAtMTI1IC0xNzggLTIwNiAtMTkgLTQyIC00NiAtODkgLTU5IC0xMDUKLTM1IC00MSAtMTUwIC0yMjAgLTE3OCAtMjc1IC0xMyAtMjUgLTM2IC02NCAtNTEgLTg3IC0xNiAtMjMgLTQ4IC04NCAtNzIKLTEzNSAtMjQgLTUxIC01NSAtMTExIC02OCAtMTMzIC0xNCAtMjIgLTM2IC02NSAtNDggLTk1IC0xMyAtMzAgLTYyIC0xMDcKLTExMCAtMTcwIC03NiAtMTAyIC0xNjUgLTI1MyAtMjM3IC00MDUgLTc4IC0xNjMgLTE2NyAtMzE3IC0yNTcgLTQ0MiAtNDcgLTY3Ci0xMDQgLTE1OSAtMTI1IC0yMDUgLTIxIC00NSAtNTAgLTEwMSAtNjMgLTEyMyAtMTQgLTIyIC0zOCAtNjkgLTUzIC0xMDUgLTE1Ci0zNiAtMzggLTc4IC01MCAtOTUgLTEzIC0xNiAtNjUgLTk3IC0xMTUgLTE4MCAtNTEgLTgyIC0xMDYgLTE2OSAtMTIyIC0xOTEKLTE2IC0yMyAtNDggLTg0IC03MiAtMTM1IC0yNCAtNTIgLTU1IC0xMTIgLTY4IC0xMzQgLTE0IC0yMiAtMzcgLTY3IC01MSAtMTAxCi0xNCAtMzMgLTYzIC0xMTIgLTEwOSAtMTc1IC04OSAtMTIyIC0xNTggLTI0MCAtMjQwIC00MDggLTI4IC01OCAtNjIgLTEyNQotNzcgLTE1MCAtMTUgLTI1IC0zOSAtNzQgLTU0IC0xMDggLTE0IC0zNSAtNDcgLTg5IC03MiAtMTIxIC0xNDIgLTE3OSAtMTYxCi0yMjMgLTE1NCAtMzU2IDUgLTk4IDI1IC0xNDIgNzUgLTE2MiA4NCAtMzUgMTE4IDAgMzIzIDMzNiA0NiA3NCA5OCAxNTcgMTE3CjE4NCAxOSAyNyA1NCA5MCA3NyAxNDAgMjQgNTAgNTQgMTA5IDY3IDEzMSAxNCAyMiAzNyA2NyA1MSAxMDEgMTQgMzMgNjMgMTEyCjEwOCAxNzUgOTIgMTI2IDE2MiAyNDYgMjQ1IDQxNyAzMSA2MiA2NiAxMjkgNzggMTUwIDEzIDIwIDM2IDY3IDUyIDEwNCAxNSAzNwo0MiA4NSA1OSAxMDUgMTAyIDEyMiAxNDkgMjAwIDI4NSA0NjkgMzEgNjAgNjUgMTIzIDc3IDE0MCAxMSAxNiAzOCA2MSA1OSA5OQoyMSAzOSA3NiAxMjYgMTIyIDE5MyA0NiA2OCAxMDMgMTY1IDEyOCAyMTUgMjQgNTEgNTMgMTA4IDY0IDEyNyAxMSAxOSAzNSA2Nwo1NCAxMDUgNDMgODkgMTEwIDIwMiAyMTQgMzU3IDQ2IDY4IDEwNyAxNzMgMTM3IDIzMyAzMCA2MSA2NCAxMjYgNzUgMTQ1IDEyCjE5IDM0IDY0IDUxIDEwMCAxNiAzNiA2NiAxMTUgMTEwIDE3NSAxMjQgMTY4IDIzOCAzODYgMjQ3IDQ2OSAxMSAxMDggLTE2IDE0NgotMTA0IDE0NiAtMzIgLTEgLTcxIC03IC04OCAtMTR6Ii8+CjxwYXRoIGQ9Ik0xOTE2IDU0MSBjLTI0IC0yNiAtMjMgLTEwMiAxIC0xNDQgMzAgLTUwIDU5IC02MCAxMjQgLTQxIDU5IDE4IDE0OQoxNSAyMzIgLTggNjAgLTE2IDc3IDAgNzcgNzIgMCA3MSAtMTcgODggLTc0IDcyIC0xMDQgLTI3IC0xNzggLTE2IC0yNDYgNDAKLTQxIDMzIC04OSAzNyAtMTE0IDl6Ii8+CjxwYXRoIGQ9Ik01OTUgNDg3IGMtNjggLTY2IC02OCAtNjggMSAtMTM0IDY2IC02MSA4OCAtNjUgMTMwIC0yMiA2MSA2MyAyNAoyMDkgLTUzIDIwOSAtMTUgMCAtNDQgLTIwIC03OCAtNTN6Ii8+CjxwYXRoIGQ9Ik0xODQgNDc2IGMtNTEgLTM4IC0xMCAtMTQwIDQ1IC0xMTIgNTIgMjcgNjcgNTMgNDUgNzcgLTMzIDM3IC02OCA1MAotOTAgMzV6Ii8+CjwvZz4KPC9zdmc+";

// ─────────────────────────────────────────────────────────────
// Runaki means "light". The page is a sunrise over the Kurdistan mountains
// and the sky follows the agent's real local time: dawn, day, dusk, night.
// ─────────────────────────────────────────────────────────────

const GOLD = '#D2AD54';

const SKIES = {
  dawn: {
    top: '#5565B0', bottom: '#FFD2A2', orb: '#FFB050', glow: '#FFC070', glowOp: 0.55,
    ridges: ['#E9BDB8', '#B98BA8', '#715C93', '#2B2656'],
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.88)', clouds: 0.38, stars: 0, dark: false,
  },
  day: {
    top: '#4F9FE3', bottom: '#FDEBBE', orb: '#FFD257', glow: '#FFE9A0', glowOp: 0.6,
    ridges: ['#B5D2EE', '#7AA6D2', '#4373A8', '#15305A'],
    text: '#0C1A33', sub: 'rgba(12,26,51,0.78)', clouds: 0.7, stars: 0, dark: false,
  },
  dusk: {
    top: '#3A4585', bottom: '#FFA06C', orb: '#FF7A45', glow: '#FF9A62', glowOp: 0.6,
    ridges: ['#E3948C', '#AB6580', '#5E4074', '#231B46'],
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.88)', clouds: 0.3, stars: 0.25, dark: false,
  },
  night: {
    top: '#091128', bottom: '#27407A', orb: '#EEF1FA', glow: '#8FA6E0', glowOp: 0.35,
    ridges: ['#2B4580', '#1C3166', '#12234D', '#0A1430'],
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', clouds: 0, stars: 1, dark: true,
  },
};

// Greetings: English, Sorani and Arabic. Hello is used in the afternoon.
const GREET = {
  morning: { en: 'Good morning.', ku: 'بەیانی باش', ba: 'سپێدە باش', ar: 'صباح الخير' },
  hello: { en: 'Hello.', ku: 'سڵاو', ba: 'سڵاڤ', ar: 'مرحباً' },
  evening: { en: 'Good evening.', ku: 'ئێوارە باش', ba: 'ئێڤارە باش', ar: 'مساء الخير' },
};

function phaseFor(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 16.5) return 'day';
  if (hour >= 16.5 && hour < 19.5) return 'dusk';
  return 'night';
}
function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return GREET.morning;
  if (hour >= 12 && hour < 16.5) return GREET.hello;
  return GREET.evening;
}

// optional preview: /login?sky=dawn|day|dusk|night
function useSky() {
  const read = () => {
    const forced = new URLSearchParams(window.location.search).get('sky');
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    if (forced && SKIES[forced]) {
      const fh = { dawn: 6.2, day: 12, dusk: 17.8, night: 22 }[forced];
      return { phase: forced, hour: fh };
    }
    return { phase: phaseFor(h), hour: h };
  };
  const [sky, setSky] = useState(read);
  useEffect(() => {
    const id = setInterval(() => setSky(read()), 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);
  return sky;
}

// small seeded random so the mountains look the same on every visit
function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
function ridgePath(seed, base, amp, step, jag) {
  const r = rng(seed);
  const pts = [];
  for (let x = -step; x <= 1200 + step; x += step) {
    const wave = Math.sin(x / 190 + seed) * amp * 0.55 + Math.sin(x / 83 + seed * 2) * amp * 0.25;
    pts.push([x, base - amp * 0.5 + wave + (r() - 0.5) * amp * jag]);
  }
  let d = `M${pts[0][0]},${pts[0][1].toFixed(1)}`;
  pts.slice(1).forEach(p => { d += ` L${p[0]},${p[1].toFixed(1)}`; });
  return d + ' L1260,820 L-60,820 Z';
}
const RIDGE_PATHS = [
  ridgePath(7, 560, 120, 46, 0.9),
  ridgePath(13, 620, 110, 38, 0.8),
  ridgePath(29, 690, 90, 32, 0.7),
  ridgePath(41, 760, 60, 26, 0.5),
];
const STARS = (() => {
  const r = rng(99);
  // keep stars out of the area behind the text
  return Array.from({ length: 80 }, () => ({ x: r() * 1200, y: r() * 430, s: 0.7 + r() * 1.5, o: 0.35 + r() * 0.6 }))
    .filter(st => !(st.x < 760 && st.y > 40 && st.y < 420));
})();

function Scene({ phase, hour }) {
  const k = SKIES[phase];
  const night = phase === 'night';
  // how far along its arc the sun (or moon) is, 0 to 1
  let t = night ? ((hour - 19 + 24) % 24) / 10 : (hour - 6) / 12;
  t = Math.min(0.94, Math.max(0.06, t));
  const cx = 700 + 420 * t;            // keeps the sun on the right, clear of the headline
  const cy = 600 - Math.sin(Math.PI * t) * 360;
  const r = night ? 46 : 58;
  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" stopColor={k.glow} stopOpacity={k.glowOp} />
          <stop offset="100%" stopColor={k.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cloudfade" x1="760" x2="940" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="cloudmask"><rect x="0" y="0" width="1200" height="800" fill="url(#cloudfade)" /></mask>
        <mask id="crescent">
          <rect x="0" y="0" width="1200" height="800" fill="black" />
          <circle cx={cx} cy={cy} r={r} fill="white" />
          <circle cx={cx + 22} cy={cy - 12} r={r * 0.92} fill="black" />
        </mask>
      </defs>

      {k.stars > 0 && STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o * k.stars} />)}

      <g className="rk-orb">
        <circle cx={cx} cy={cy} r="260" fill="url(#glow)" />
        {night
          ? <circle cx={cx} cy={cy} r={r} fill={k.orb} mask="url(#crescent)" />
          : <circle cx={cx} cy={cy} r={r} fill={k.orb} />}
      </g>

      {k.clouds > 0 && (
        <g opacity={k.clouds} fill="#fff" mask="url(#cloudmask)">
          <g className="rk-cloud rk-cloud-a"><ellipse cx="150" cy="250" rx="110" ry="18" /><ellipse cx="205" cy="236" rx="70" ry="16" /></g>
          <g className="rk-cloud rk-cloud-b"><ellipse cx="760" cy="150" rx="90" ry="14" /><ellipse cx="810" cy="138" rx="55" ry="12" /></g>
        </g>
      )}

      {RIDGE_PATHS.map((d, i) => <path key={i} d={d} fill={k.ridges[i]} />)}
    </svg>
  );
}

const FEATURES = [
  ['Shortlisted FAQs', 'The questions customers ask most, approved by QA.'],
  ['Knowledge base', 'Verified answers and scripts in Sorani, Badini and Arabic.'],
  ['Runaki AI assistant', 'Ask in your own words and get an approved answer.'],
  ['Ticket descriptions', 'Find the right wording and copy it into the ticket.'],
  ['Zone lookup', 'Find the zone for any neighborhood in seconds.'],
];

function Hero({ phase, hour, compact }) {
  const k = SKIES[phase];
  const g = greetingFor(hour);
  const greets = [['ckb', g.ku], ['kmr', g.ba], ['ar', g.ar]];
  return (
    <div className="rk-pad" style={{ position: 'relative', zIndex: 2, padding: compact ? '34px 28px' : '64px 64px', maxWidth: compact ? 'none' : 760 }}>
      <h2 className="rk-h2" style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: compact ? 38 : 'clamp(46px, 5.4vw, 76px)', lineHeight: 1.02, letterSpacing: '-0.025em', color: k.text }}>{g.en}</h2>
      <div className="rk-greets" style={{ display: 'flex', alignItems: 'center', marginTop: compact ? 10 : 16, fontFamily: ARABIC, fontWeight: 600, fontSize: compact ? 19 : 25, color: k.text }}>
        {greets.map(([lang, word], i) => (
          <span key={lang} dir="rtl" lang={lang} style={{ paddingRight: i < greets.length - 1 ? (compact ? 14 : 22) : 0, marginRight: i < greets.length - 1 ? (compact ? 14 : 22) : 0, borderRight: i < greets.length - 1 ? `1.5px solid ${k.text}55` : 'none', lineHeight: 1.1 }}>{word}</span>
        ))}
      </div>
      {!compact && (
        <>
          <p className="rk-intro" style={{ margin: '34px 0 0', fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, lineHeight: 1.4, color: k.text }}>
            Everything you need during a call, in one place.
          </p>
          <ul className="rk-list" style={{ listStyle: 'none', margin: '30px 0 0', padding: 0, maxWidth: 440 }}>
            {FEATURES.map(([title, desc]) => (
              <li key={title} className="rk-li" style={{ marginBottom: 12 }}>
                <div className="rk-title" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: k.text }}>{title}</div>
                <div className="rk-desc" style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 14.5, lineHeight: 1.4, color: k.sub }}>{desc}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const DISPLAY = "'Bricolage Grotesque','Segoe UI',system-ui,sans-serif";
const ARABIC = "'Noto Sans Arabic','Segoe UI',Tahoma,sans-serif";

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a20.7 20.7 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { phase, hour } = useSky();
  const k = SKIES[phase];
  const P = k.dark ? DARK : LIGHT;
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [focused, setFocused] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await login(form.identifier, form.password);
    if (!res.ok) { toast.error(res.error); return; }
    if (res.mfaRequired) { navigate('/mfa', { state: { challengeToken: res.challengeToken } }); return; }
    toast.success('Welcome back!');
    navigate('/');
  };

  const input = on => ({
    width: '100%', boxSizing: 'border-box', background: P.input, border: `1.5px solid ${on ? GOLD : P.border}`,
    borderRadius: 14, padding: '14px 16px 14px 46px', color: P.text, fontSize: 16, fontFamily: DISPLAY,
    outline: 'none', boxShadow: on ? `0 0 0 4px ${GOLD}33` : 'none', transition: 'border-color .15s, box-shadow .15s',
  });
  const ico = { position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: P.muted, display: 'flex', pointerEvents: 'none' };

  const form_ = (
    <div style={{ width: '100%', maxWidth: 380, margin: 'auto' }}>
      <div className="rk-logo" style={{ marginBottom: 46 }}>
        <img className="rk-logo-img" src={k.dark ? RK_LOGO_DARK : RK_LOGO} alt="Runaki" style={{ height: 60, width: 'auto', display: 'block' }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: P.muted, marginTop: 12, letterSpacing: '0.02em' }}>Knowledge Base</div>
      </div>

      <h1 className="rk-h1" style={{ margin: 0, fontFamily: DISPLAY, fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', color: P.text }}>Sign in</h1>
      <p className="rk-sub" style={{ margin: '10px 0 0', fontFamily: DISPLAY, fontSize: 16, color: P.muted }}>Sign in with your Wave ID or work email.</p>

      <form className="rk-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 30 }}>
        <div>
          <label htmlFor="rk-id" style={{ display: 'block', marginBottom: 8, fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: P.label }}>Email or Wave ID</label>
          <div style={{ position: 'relative' }}>
            <span style={ico}><UserIcon /></span>
            <input id="rk-id" type="text" autoComplete="username" autoFocus placeholder="you@runaki.com or Wave ID"
              value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })}
              onFocus={() => setFocused('id')} onBlur={() => setFocused('')} className="rk-in" style={input(focused === 'id')} required />
          </div>
        </div>

        <div>
          <label htmlFor="rk-pw" style={{ display: 'block', marginBottom: 8, fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: P.label }}>Password</label>
          <div style={{ position: 'relative' }}>
            <span style={ico}><LockIcon /></span>
            <input id="rk-pw" type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyUp={e => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
              onFocus={() => setFocused('pw')} onBlur={() => { setFocused(''); setCapsOn(false); }}
              className="rk-in" style={{ ...input(focused === 'pw'), paddingRight: 48 }} required />
            <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.muted, padding: 6, display: 'flex', borderRadius: 8 }}>
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {capsOn && <div role="status" style={{ marginTop: 8, fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: P.warn }}>Caps Lock is on.</div>}
        </div>

        <button type="submit" disabled={loading} className="rk-btn"
          style={{ marginTop: 6, padding: 16, borderRadius: 14, border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: DISPLAY,
            background: `linear-gradient(135deg, ${GOLD}, #EBCB7E)`, color: '#1b1405', fontWeight: 800, fontSize: 16.5,
            boxShadow: '0 10px 26px rgba(210,173,84,0.38)', opacity: loading ? 0.85 : 1 }}>
          {loading
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><span className="rk-spin" /> Signing in…</span>
            : 'Sign in'}
        </button>
      </form>

      <div className="rk-foot" style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${P.border}`, fontFamily: DISPLAY, fontSize: 13.5, lineHeight: 1.65, color: P.muted }}>
        <div>Need access or a password reset? Ask your Team Lead.</div>
        <div style={{ marginTop: 4 }}>For authorised Runaki staff only.</div>
      </div>
    </div>
  );

  const sky = { background: `linear-gradient(180deg, ${k.top} 0%, ${k.bottom} 78%)` };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Noto+Sans+Arabic:wght@500..700&display=swap');
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        .rk-orb { animation: rkRise 2.4s cubic-bezier(.16,.8,.24,1) both; }
        .rk-cloud-a { animation: rkDrift 110s linear infinite; }
        .rk-cloud-b { animation: rkDrift 150s linear infinite; animation-delay: -60s; }
        .rk-spin { width: 16px; height: 16px; border: 2.5px solid rgba(27,20,5,.28); border-top-color: #1b1405; border-radius: 50%; animation: rkSpin .8s linear infinite; display: inline-block; }
        .rk-btn { transition: transform .15s, box-shadow .15s; }
        .rk-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(210,173,84,.5); }
        .rk-btn:focus-visible, #rk-pw ~ button:focus-visible { outline: 3px solid ${GOLD}; outline-offset: 3px; }
        @keyframes rkRise { from { transform: translateY(330px); } to { transform: translateY(0); } }
        @keyframes rkDrift { from { transform: translateX(-340px); } to { transform: translateX(1500px); } }
        @keyframes rkSpin { to { transform: rotate(360deg); } }
        @media (max-height: 780px) {
          .rk-intro { display: none !important; }
          .rk-pad { padding-top: 36px !important; padding-bottom: 20px !important; }
          .rk-h2 { font-size: min(76px, 9.5vh) !important; }
          .rk-list { margin-top: 26px !important; }
          .rk-li { margin-bottom: 8px !important; }
          .rk-desc { font-size: 13.5px !important; }
          .rk-logo { margin-bottom: 30px !important; }
          .rk-logo-img { height: 50px !important; }
          .rk-h1 { font-size: 32px !important; }
          .rk-form { gap: 14px !important; margin-top: 20px !important; }
          .rk-in { padding-top: 11px !important; padding-bottom: 11px !important; }
          .rk-foot { margin-top: 20px !important; padding-top: 14px !important; }
        }
        @media (max-height: 640px) {
          .rk-pad { padding-top: 26px !important; padding-bottom: 12px !important; }
          .rk-h2 { font-size: min(76px, 8.2vh) !important; }
          .rk-greets { margin-top: 8px !important; font-size: 19px !important; }
          .rk-list { margin-top: 22px !important; }
          .rk-li { margin-bottom: 6px !important; }
          .rk-title { font-size: 14.5px !important; }
          .rk-desc { font-size: 12.5px !important; line-height: 1.3 !important; }
          .rk-logo { margin-bottom: 24px !important; }
          .rk-logo-img { height: 42px !important; }
          .rk-h1 { font-size: 27px !important; }
          .rk-sub { margin-top: 6px !important; font-size: 14px !important; }
          .rk-form { gap: 10px !important; margin-top: 14px !important; }
          .rk-in { padding-top: 9px !important; padding-bottom: 9px !important; font-size: 15px !important; }
          .rk-btn { padding: 12px !important; }
          .rk-foot { margin-top: 14px !important; padding-top: 10px !important; font-size: 12.5px !important; }
          .rk-left { padding-top: 16px !important; padding-bottom: 16px !important; }
        }
        @media (max-height: 470px) { .rk-desc { display: none !important; } }
        .rk-left { scrollbar-width: none; -ms-overflow-style: none; }
        .rk-left::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { .rk-orb, .rk-cloud-a, .rk-cloud-b { animation: none; } }
      `}</style>

      <div style={{ minHeight: '100vh', width: '100%', background: P.bg, display: 'flex', flexDirection: isMobile ? 'column' : 'row', fontFamily: DISPLAY, overflow: isMobile ? 'auto' : 'hidden', height: isMobile ? 'auto' : '100vh' }}>
        {isMobile && (
          <div style={{ position: 'relative', height: 250, flex: '0 0 auto', overflow: 'hidden', ...sky }}>
            <Scene phase={phase} hour={hour} />
            <Hero phase={phase} hour={hour} compact />
          </div>
        )}

        <div className="rk-left" style={{ flex: isMobile ? '1 0 auto' : '0 0 500px', background: P.bg, display: 'flex', overflowY: isMobile ? 'visible' : 'auto', minHeight: 0, padding: isMobile ? '34px 24px 40px' : '40px 56px', boxSizing: 'border-box',
          borderRadius: isMobile ? '26px 26px 0 0' : 0, marginTop: isMobile ? -26 : 0, position: 'relative', zIndex: 3 }}>
          {form_}
        </div>

        {!isMobile && (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', ...sky }}>
            <Scene phase={phase} hour={hour} />
            <Hero phase={phase} hour={hour} />
            <div style={{ position: 'absolute', left: 40, bottom: 26, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Powered by</span>
              <img src={HP_ICON} alt="" style={{ height: 22, width: 'auto' }} />
              <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', color: '#fff' }}>HIGH-PERFORMANCE</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const LIGHT = {
  bg: '#F5F8FC', text: '#0C1A33', label: '#22324F', muted: '#56667D', border: '#CBD6E4', input: '#FFFFFF',
  warn: '#B4530A', logoShadow: '0 6px 20px rgba(12,26,51,0.10)',
};
const DARK = {
  bg: '#0B111C', text: '#F2F5F9', label: '#CBD5E2', muted: '#97A5B9', border: 'rgba(255,255,255,0.14)', input: 'rgba(255,255,255,0.05)',
  warn: '#F5B25C', logoShadow: '0 10px 30px rgba(0,0,0,0.4)',
};
