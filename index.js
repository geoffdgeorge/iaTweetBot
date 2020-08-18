const axios = require('axios');
const Twit = require('twit');
const fs = require('fs');
require('dotenv').config();

const T = new Twit({
    consumer_key: process.env.CONSUMER_API_KEY,
    consumer_secret: process.env.CONSUMER_API_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

const requestRandomBook = async () => {
    const randomNumPages = Math.floor((Math.random() * 1500) + 1)
    const randomYear = 1440 + Math.floor((Math.random() * 580))

    console.log(randomNumPages)
    console.log(randomYear)

    const call = await axios.get(`https://archive.org/advancedsearch.php?q=mediatype%3Atexts+and+imagecount%3A${randomNumPages}+and+year%3A${randomYear}&fl%5B%5D=avg_rating&fl%5B%5D=backup_location&fl%5B%5D=btih&fl%5B%5D=call_number&fl%5B%5D=collection&fl%5B%5D=contributor&fl%5B%5D=coverage&fl%5B%5D=creator&fl%5B%5D=date&fl%5B%5D=description&fl%5B%5D=downloads&fl%5B%5D=external-identifier&fl%5B%5D=foldoutcount&fl%5B%5D=format&fl%5B%5D=genre&fl%5B%5D=headerImage&fl%5B%5D=identifier&fl%5B%5D=imagecount&fl%5B%5D=indexflag&fl%5B%5D=item_size&fl%5B%5D=language&fl%5B%5D=licenseurl&fl%5B%5D=mediatype&fl%5B%5D=members&fl%5B%5D=month&fl%5B%5D=name&fl%5B%5D=noindex&fl%5B%5D=num_reviews&fl%5B%5D=oai_updatedate&fl%5B%5D=publicdate&fl%5B%5D=publisher&fl%5B%5D=related-external-id&fl%5B%5D=reviewdate&fl%5B%5D=rights&fl%5B%5D=scanningcentre&fl%5B%5D=source&fl%5B%5D=stripped_tags&fl%5B%5D=subject&fl%5B%5D=title&fl%5B%5D=type&fl%5B%5D=volume&fl%5B%5D=week&fl%5B%5D=year&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=500&page=1&output=json`);

    const books = call.data.response.docs;

    if (books.length === 0) {
        return requestRandomBook()
    }

    const randomBook = books[Math.floor(Math.random() * books.length)]

    if (randomBook.collection.includes('inlibrary')) {
        return requestRandomBook()
    }

    return randomBook;
}

const fullCall = async () => {
    const randomBook = await requestRandomBook();

    console.log(randomBook)
    console.log(`https://archive.org/download/${randomBook.identifier}/page/n${Math.floor(Math.random() * randomBook.imagecount)}.jpg`);
    console.log(`https://archive.org/details/${randomBook.identifier}`)

    const bookLink = `https://archive.org/details/${randomBook.identifier}`
    const tweet = `${randomBook.title} (Published: ${randomBook.year})\nFull text: ${bookLink}`
    
    const imageLink = `https://archive.org/download/${randomBook.identifier}/page/n${Math.floor(Math.random() * randomBook.imagecount)}.jpg`
    const image = await axios.get(imageLink, {responseType: 'arraybuffer'});
    const base64Image = Buffer.from(image.data).toString('base64');

    console.log(tweet)

    return T.post('media/upload', { media_data: base64Image }, function (err, data, response) {
        const mediaIdStr = data.media_id_string
        const altText = `Page image from ${randomBook.title}`
        const meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
       
        return T.post('media/metadata/create', meta_params, function (err, data, response) {
            if (!err) {
                const params = { status: tweet, media_ids: [mediaIdStr] }
        
                return T.post('statuses/update', params, function (err, data, response) {
                    return
                })
            }

            console.log(err)
        })
    })
}

fullCall()