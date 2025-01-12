import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'

puppeteer.use(StealthPlugin())

let browser

const runTest = async () => {
  try {
    // Launching the browser with specified configurations
    console.log('Initializing the browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-popup-blocking',
        '--lang=en' // Enforcing English language
      ]
    })

    const pages = await browser.pages()
    const page = pages.length > 0 ? pages[0] : await browser.newPage()

    // Load cookies if available
    if (fs.existsSync('cookies.json')) {
      const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'))
      await page.setCookie(...cookies)
      console.log('Cookies have been successfully loaded into the browser.')
    } else {
      console.warn(
        'No cookies found. Please log in manually to generate the necessary cookies.'
      )
    }

    // Navigate to the specified TradingView chart
    console.log('Navigating to TradingView chart...')
    await page.goto(
      'https://www.tradingview.com/chart/k4N4Qr4X/?symbol=COINBASE%3ABTCUSD',
      {
        timeout: 180000,
        waitUntil: ['load', 'domcontentloaded']
      }
    )

    const userLoggedInSelector =
      'div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button'
    const sidebarVisibleSelector = `button[aria-label="Watchlist, details and news"]`

    console.log('Checking login status...')
    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(userLoggedInSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'NotLoggedIn'),
      page
        .waitForSelector(sidebarVisibleSelector, {
          visible: true,
          timeout: 60000
        })
        .then(() => 'AlreadyLoggedIn')
    ])

    console.log('Login status identified:', firstAvailableElement)

    if (firstAvailableElement === 'NotLoggedIn') {
      console.log('Initiating login process...')
      const loginBtn = await page.waitForSelector(
        'div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button'
      )
      await page.evaluate(element => element.click(), loginBtn)

      console.log('Selecting Google login option...')
      const googleLoginSelector = await page.waitForSelector(
        'div > div.nsm7Bb-HzV7m-LgbsSe-bN97Pc-sM5MNb > span.nsm7Bb-HzV7m-LgbsSe-BPrWId'
      )
      await page.evaluate(element => element.click(), googleLoginSelector)

      const loggedInCheckSelector =
        'body > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div:nth-child(2) > div > div > div.firstItem-RsFlttSS.symbolName-RsFlttSS > span > div > div > span.inner-RsFlttSS.symbolNameText-RsFlttSS'

      while (true) {
        try {
          console.log('Checking if login was successful...')
          await page.waitForSelector(loggedInCheckSelector, {
            visible: true,
            timeout: 5000
          })
          console.log('Login successful.')
          break
        } catch {
          console.log('Still waiting for login to complete...')
        }
      }

      console.log('Refreshing the page after login...')
      await page.reload({
        timeout: 180000,
        waitUntil: ['load', 'domcontentloaded']
      })

      // Save cookies to a file
      const cookies = await page.cookies()
      fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2))
      console.log('Cookies have been successfully saved to cookies.json.')
    } else {
      console.log('User is already logged in. Proceeding...')
    }
  } catch (error) {
    console.error('An error occurred during the process:', error)
  } finally {
    console.log('Closing the browser...')
    if (browser) await browser.close()
  }
}

runTest()
