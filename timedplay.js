import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'
import { login, TimeFunction } from './mainFunctions.js'
import {
  delay,
  initializeLogging,
  loadCookies,
  readJSONFile
} from './functions.js'

// Use the data in your script
const jsonData = readJSONFile('./config.json')

puppeteer.use(StealthPlugin())

// const URL = "https://www.tradingview.com/chart/k4N4Qr4X/?symbol=NSE%3ARELIANCE";
const URL = jsonData.URL

const BROWSER_PATH =
  //   '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Change this path to your desired browser's path

initializeLogging('TimeScript', jsonData.lists[0])

let browser
let listNotFound = false
const POLL_INTERVAL = 2000 // Interval in milliseconds between checks
const TIMEOUT = 60000 // Total timeout duration in milliseconds
const runTest = async () => {
  console.log('TradingView Time Script is running...')
  const cookieFilePath = './cookies.json'
  try {
    // Launch a headful Chrome browser
    // ignoreing checking http errors(like authenticating(SSL))
    // want our page should take full width of browser
    browser = await puppeteer.launch({
      //   ignoreHTTPSErrors: true,
      headless: false,
      defaultViewport: null,
      // executablePath: BROWSER_PATH,
      args: [
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-popup-blocking'
      ]
    })

    // checking if page is created or not and then selecting the first page to work on otherwise creating a new page
    const pages = await browser.pages()
    const page = pages.length > 0 ? pages[0] : await browser.newPage()

    // Load cookies if they exist
    if (fs.existsSync(cookieFilePath)) {
      await loadCookies(page, cookieFilePath)
    }

    // Navigate to the website
    await page.goto(URL, {
      timeout: 180000,
      waitUntil: ['load', 'domcontentloaded']
    })

    /////////////////////////////////
    //  Log in to the website
    /////////////////////////////////

    const sidebarVisibleSelector = `button[aria-label="Watchlist, details and news"]`

    //Login in the website
    // craeting variable of the inputs and button of the login page
    // const usernLoggedInSelector = '#tv-content > div > div > div > div > strong'
    const usernLoggedInSelector =
      'div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button'

    const stockPriceSelector =
      'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9'

    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(usernLoggedInSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'Not LoggedIn'),
      page
        .waitForSelector(sidebarVisibleSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'sidebar visible')
    ])

    if (firstAvailableElement == 'sidebar visible') {
      let stockPriceVisible = false

      // While loop to check the visibility of the stock price and click sidebar if necessary
      while (!stockPriceVisible) {
        stockPriceVisible = await page.evaluate(selector => {
          const element = document.querySelector(selector)
          return element !== null && element.offsetParent !== null // Check if the stock price element is visible
        }, stockPriceSelector)

        if (!stockPriceVisible) {
          // Click on the sidebar to refresh the content
          await page.click(sidebarVisibleSelector)

          // Wait for 3 seconds before checking again
          await delay(4000)
        }
      }
    }
    if (firstAvailableElement == 'Not LoggedIn') {
      await login(
        browser,
        page,
        cookieFilePath,
        firstAvailableElement,
        jsonData
      )

      await TimeFunction(page, jsonData, listNotFound, POLL_INTERVAL, TIMEOUT)
    } else {
      console.log('i am already logged in')
      await TimeFunction(page, jsonData, listNotFound, POLL_INTERVAL, TIMEOUT)
    }

    console.log('Time Script Finished')
    // Close the browser
  } catch (error) {
    console.log(error)
  } finally {
    await browser.close()
  }
}

runTest()
