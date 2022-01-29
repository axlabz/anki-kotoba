# anki-kotoba

Scripts to help with mining words and setting up Anki vocabulary decks for 
studying Japanese. For now this includes just an [Yomichan](https://foosoft.net/projects/yomichan/) 
importer to help with maintaining a personal vocabulary deck:

<img src="https://i.imgur.com/nQ29W2b.png" width="400" title="Sample back-side for a card" />

The entry above is generated from the raw Yomichan entry. The script copies the
Yomichan entry to a personal vocabulary deck. It will also:
- Format the glossary to be more compact and remove duplicates.
- Add kanji definitions formatted using a stroke order font ([here](https://sites.google.com/site/nihilistorguk/)).
- Merge the entry with audio and sample sentence from a Core 6000K deck ([1](https://ankiweb.net/shared/info/1880390099), 
[2](https://ankiweb.net/shared/info/1678635361), and [3](https://ankiweb.net/shared/info/764667979)).
  - Note that the original Yomichan audio is also included, so most entries will
    have two audio files for the glossary pronunciation, plus the sentence 
    pronunciation.
  - The card layout will fallback to TTS pronunciation if no audio is available
    for the glossary.
- The script will also add tooltips to the Yomichan tags and include links to
  [jisho.org](https://jisho.org/), [forvo.com](https://forvo.com/) and
  [tatoeba.org](https://tatoeba.org/) for the entry:

The original Yomichan glossary definition, before being compacted and de-duplicated:

<img src="https://i.imgur.com/zFr8dk1.png" width="200" title="Original glossary">


## Card Layout Features

Furigana readings are available as mouse-over tooltips, or can be toggled by 
clicking the text:

<img src="https://i.imgur.com/IMhUI1Z.png" width="400" title="Vocabulary readings">

Sentence english definition is given as a tooltip:

<img src="https://i.imgur.com/oKsbT4f.png" width="400" title="Sentence translation tooltip">

Tag tooltip and external links:

<img src="https://i.imgur.com/GRF1jqa.png" width="300" />


## How to Install

This script requires [Node.js](https://nodejs.org/). Any recent version will do.

Download the source code to a directory and open a command line in that directory.
Run the command `npm install` in the command line to download the script dependencies to the local directory. Note that everything is done on the local directory and nothing will be installed or changed on the computer itself.

Make sure to setup Anki as instructed below. After that, you can just add cards using Yomichan and run this script using the command `npm start` to import them to your vocabulary.


## Setting up Anki

This assumes you've already did the basic setup for [Anki](https://apps.ankiweb.net/), [AnkiConnect](https://ankiweb.net/shared/info/2055492159), and [Yomichan](https://foosoft.net/projects/yomichan/).


The script assumes the names of Anki decks to be as follows. You can always edit
those in the top of `index.js`:

- `Japanese::Vocabulary`: this is the main deck where your entries will be.
- `Data::Yomichan`: the deck that Yomichan will add entries to.
- `Data::Core 6K`: the core 6K deck to source for sentences and audio (see above for download links).

The Yomichan deck is where new cards are added by Yomichan and where the script
will check for new entries. The most important part is setting up the settings
on the Yomichan browser extension:


Main setup. Make sure to add the `yomichan-new` tag. This is what the script
uses to detect new entries. That will be removed when the script runs:

![Anki Setup](docs/yomichan-anki-settings.png?raw=true "Anki Setup")

You must create and setup the Yomichan card layout and deck in Anki. Just make sure to name the deck `Data::Yomichan` (or change it in the script) and create a field in the card layout for each field in the Yomichan settings, with the same name:

![Anki Cards](docs/yomichan-anki-cards.png?raw=true "Anki Cards")

Just for reference, those are the dictionaries I use. The script should work
with any set of dictionaries though:

![Dictionaries](docs/yomichan-dictionaries.png?raw=true "Anki Cards")
