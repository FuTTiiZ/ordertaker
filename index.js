import fs from 'fs'

import { config } from 'dotenv'
config()

import { Configuration, OpenAIApi } from 'openai'
const OpenAI = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

const prompt = `
  McDonald's menu ser således ud:
  [
    { id: 'cb', name: 'Cheeseburger', price: 13 },
    { id: 'hb', name: 'Hammburger', price: 12 },
    { id: 'csc', name: 'Chicken Salsa Cheese', price: 25 },
    { id: 'bm', name: 'Big Mac', price: 35 },
    { id: 'mcc', name: 'McChicken', price: 32 },
    { id: 'btb', name: 'Big Tasty Bacon', price: 45 },
    { id: 'ntb', name: '18 stk. Chicken McNuggets', price: 65 },
    { id: 'cctb2', name: '6 stk. Chilli Cheese Tops', price: 22 },
  ]

  Din opgaver er at returnere kundens bestilling som et json objekt, med produktets id som key og antallet som value.
  Retunér kun produkter der er bestilt.
  Vær opmærksom på, at der sandsynligvis også indgår dialog fra en medarbejder i teksten. Det er vigtigt, at du kun returnerer kundens bestilling. 

  Du må antage, at kunden nogle gange laver fejl. Siger kunden f.eks. "20 nuggets", må du antage, at kunden kun ønsker 18 nuggets, da McDonald's ikke tilbyder 20 nuggets
  som produkt, og du derfor må runde op. Ligeledes kan en kunde komme til at sige "7 chilli cheese tops", hvilket du må antage er 6 stk., da det er det tætteste produkt.
  Det er vitigt, at du *altid* vælger det nærmest mulige antal.
  Der også vigigt at huske, at nogle produkter, som f.eks. nuggets og chilli cheese tops, er pakket i antal, mens langt størstedelen af de øvrige produkter sælges enkeltvis.

  OBS: Det er vigtigt, at du *kun* returnerer et JSON objekt, og ikke en string.
`

const getOrder = audio => new Promise(async (res, rej) => {
  try {
    const { data: transcription } = await OpenAI.createTranscription(
      fs.createReadStream(audio), // audio file
      'whisper-1', // model
      `MEDARBEJDER: Hej, velkommen til McDonald's. Hvad kan jeg gøre for dig?
      KUNDE: Hej, jeg vil gerne have 4 Big Macs og 3 Hamburgere`, // prompt
      'text', // format
      undefined, // temperature
      'da', // language
    )

    const response = await OpenAI.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: transcription
        }
      ]
    })

    const order = JSON.parse(response.data.choices[0].message.content.match(/\{(.+?)\}/s)[0])

    res(order)
  } catch (error) {
    console.error(error)
    res({})
  }
})

;(async () => {
  const order1 = await getOrder('./mcd.mp3')
  const order2 = await getOrder('./mcd2.mp3')

  console.log(order1)
  console.log(order2)
})()