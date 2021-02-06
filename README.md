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
