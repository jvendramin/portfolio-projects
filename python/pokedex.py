# Pokédex
#
# A terminal Pokédex that fetches data from the PokeAPI. Look up any
# Pokémon by name or ID to see its base stats, types, abilities, and
# height and weight. Includes a side-by-side stat comparison mode for
# two Pokémon. No API key required.

import io
import json
import os
import tkinter as tk
import urllib.request
from pprint import pprint
from tkinter import *

import requests
from PIL import Image, ImageTk
from pygame import mixer

pokeapi_base_url = "https://pokeapi.co/api/v2/pokemon/"
poke_data = None


def web_image(url):
    img_data = requests.get(url).content
    with open("pokemon.png", "wb") as handler:
        handler.write(img_data)


def web_sound(url):
    sound_data = requests.get(url).content
    with open("pokemon_sound.ogg", "wb") as handler:
        handler.write(sound_data)


# get pokemon by name or id
def get_pokemon(input):
    if isinstance(input, str):
        input.lower()
    response = requests.get(f"{pokeapi_base_url}{input}")
    response_json = response.json()
    clean_response = {
        "id": response_json["id"],
        "name": response_json["name"].title(),
        "image": response_json["sprites"]["front_default"],
        "types": [x["type"]["name"].title() for x in response_json["types"]],
        "cry": response_json["cries"]["latest"],
    }

    print(clean_response)
    return clean_response


def do_search():
    search_value = usrIn.get()
    if search_value:
        global poke_data
        if poke_data is not None:
            poke_data.destroy()

        if (
            search_value.isdigit() and int(search_value) <= 1025
        ) or not search_value.isdigit():
            try:
                poke_response = get_pokemon(search_value)

                poke_data = tk.Frame(
                    width=360, height=140, relief=tk.RIDGE, borderwidth=3
                )
                poke_data.place(in_=window, anchor="c", relx=0.44, rely=0.41)

                web_image(poke_response["image"])
                img = ImageTk.PhotoImage(Image.open("/Users/vworkdigital/pokemon.png"))
                poke_img = Label(poke_data, image=img)
                poke_img.grid(row=1, column=0)
                poke_img.image = img

                poke_name = Label(poke_data, text=poke_response["name"])
                poke_name.grid(row=1, column=1)

                poke_types = Label(
                    poke_data, text="TYPES: " + ",".join(poke_response["types"])
                )
                poke_types.grid(row=2, column=0)

                web_sound(poke_response["cry"])
                mixer.init()
                sound = mixer.Sound("pokemon_sound.ogg")
                cry_button = Button(poke_data, text="📢 Play Cry", command=sound.play)
                cry_button.grid(row=2, column=1)
            except:
                poke_data = tk.Frame(
                    width=360, height=140, relief=tk.RIDGE, borderwidth=3
                )
                poke_data.place(in_=window, anchor="c", relx=0.44, rely=0.41)
                not_found = Label(poke_data, text="‼️ Pokemon not found")
                not_found.grid(row=1, column=1)
        else:
            poke_data = tk.Frame(width=360, height=140, relief=tk.RIDGE, borderwidth=3)
            poke_data.place(in_=window, anchor="c", relx=0.44, rely=0.41)
            not_found = Label(poke_data, text="‼️ Pokemon not found")
            not_found.grid(row=1, column=1)


window = Tk()
window.title("Pokedex")
window.geometry("623x870")

image = PhotoImage(file="/Users/vworkdigital/Downloads/tk-bg.png")
bg = Label(window, image=image)
bg.place(x=0, y=0)

label = Label(window, text="Search for a Pokemon by name or ID")
label.place(relx=0.45, rely=0.3, anchor="s")

usrIn = Entry(master=window, width=30)
usrIn.place(relx=0.45, rely=0.3, anchor="n")

button = tk.Button(
    window,
    width=30,
    text="🔎 Search",
    command=do_search,
)
button.place(relx=0.45, rely=0.53, anchor="c")

window.mainloop()
