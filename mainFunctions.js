import path from 'path'
import readline from 'readline'
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'
import {
  checkKeysAvailability,
  clickAdjBtn,
  convertTimeFrame,
  getCompareList,
  getSelectors,
  playVideo,
  saveCookies,
  splitFileIntoChunks,
  timeFramesSelectors
} from './functions.js'
import { ensureDirectoryExists } from './functions.js'
import { getNextFileNumber } from './functions.js'
import { getIndianDate } from './functions.js'
import { delay } from './functions.js'

//////////////////////////////////////////////
//////////////////////////////////////////////
/// Login Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function login (
  browser,
  page,
  cookieFilePath,
  firstAvailableElement,
  jsonData
) {
  if (firstAvailableElement === 'Not LoggedIn') {
    const loginBtn = await page.waitForSelector(
      '#tv-content > div > div > div > div > div > div.text-yrIMi47q.text_large-yrIMi47q > div > p:nth-child(1) > button'
    )

    await page.evaluate(element => element.click(), loginBtn)

    const googleLoginSelector = await page.waitForSelector(
      'div > div.nsm7Bb-HzV7m-LgbsSe-bN97Pc-sM5MNb > span.nsm7Bb-HzV7m-LgbsSe-BPrWId'
    )

    await page.evaluate(element => element.click(), googleLoginSelector)

    const newPagePromise = new Promise(resolve => {
      browser.on('targetcreated', async target => {
        if (target.url().includes('https://accounts.google.com')) {
          const newPage = await target.page()
          resolve(newPage)
        }
      })
    })

    const googlePopupPage = await newPagePromise
    if (!googlePopupPage) {
      throw new Error('Failed to capture the Google login popup page')
    }

    // await new Promise(resolve => setTimeout(resolve, 25000))

    // Switch to the new page
    await googlePopupPage.waitForSelector('#identifierId') // Wait for the email input field to load
    // Xb9hP

    // Interact with the Google login form
    await googlePopupPage.type('#identifierId', jsonData.accountEmail, {
      delay: 100
    })

    await googlePopupPage.click('#identifierNext > div > button > span') // Click "Next" button

    await delay(4000)

    await googlePopupPage.waitForSelector(
      '#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input',
      { visible: true }
    ) // Wait for the email input field to load

    await googlePopupPage.type(
      '#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input',
      jsonData.accountPassword,
      {
        delay: 100
      }
    )

    await googlePopupPage.click('#passwordNext > div > button > span') // Click "Next" button

    const verficationText = 'div[role="presentation"] h2 > span'

    const LoggedInCheck =
      'body > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div:nth-child(2) > div > div > div.firstItem-RsFlttSS.symbolName-RsFlttSS > span > div > div > span.inner-RsFlttSS.symbolNameText-RsFlttSS'

    const TwoFactorAuth = '#headingText > span'

    await delay(3000)
    const verificationChecking = await Promise.race([
      googlePopupPage
        .waitForSelector(TwoFactorAuth, { timeout: 60000 })
        .then(() => 'Two factor Auth'),
      googlePopupPage
        .waitForSelector(verficationText, {
          timeout: 60000
        })
        .then(() => 'Verfication Needed'),
      page
        .waitForSelector(LoggedInCheck, { timeout: 60000 })
        .then(() => 'LoggedIn')
    ])

    if (
      verificationChecking == 'Verfication Needed' ||
      verificationChecking == 'Two factor Auth'
    ) {
      await delay(jsonData.loginWait)
      await saveCookies(page, cookieFilePath)

      // Refresh the page
      await page.reload({
        timeout: 180000,
        waitUntil: ['load', 'domcontentloaded']
      })
    } else {
      console.log('Successfully loggedIn')
      await delay(7000)
      // Save the cookies after login
      await saveCookies(page, cookieFilePath)

      // Refresh the page
      await page.reload({
        timeout: 180000,
        waitUntil: ['load', 'domcontentloaded']
      })
    }
  }
}

//////////////////////////////////////////////
//////////////////////////////////////////////
/// Recording Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function RecordingFunction (
  page,
  jsonData,
  recorder,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT,
  browser
) {
  let filePath
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  // Cleanup function for SIGINT and SIGTERM
  const cleanup = async fileName => {
    if (recorder) {
      try {
        await recorder.stop()
        console.log('Recording stopped gracefully.')
      } catch (error) {
        console.error('Error stopping the recorder:', error)
      }
    } else {
      console.log('No recorder initialized.')
    }

    // Perform any other necessary cleanup here
    if (browser) {
      try {
        await browser.close()
        console.log('Browser closed gracefully.')
      } catch (error) {
        console.error('Error closing the browser:', error)
      }
    }

    if (fileName) {
      try {
        await playVideo(fileName)
      } catch (error) {
        console.error('Error playing video:', error)
      }
    }

    console.log('Recording Script is closed')

    process.exit()
  }

  const allList = jsonData.lists
  try {
    let result
    let timeFrameArray
    await delay(1000)

    if (allList.length > 1) {
      ensureDirectoryExists(jsonData.RecordingsOutputFolder)
      const currentDate = getIndianDate()
      const baseName = `${
        process.argv[2] ? process.argv[2] : allList[0]
      }-${currentDate}-${
        process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
      }`
      const extension = '.mp4'

      // Get the next available file number
      const fileName = await getNextFileNumber(
        jsonData.RecordingsOutputFolder,
        baseName,
        extension
      )

      // Set up the screen recorder
      recorder = new PuppeteerScreenRecorder(page)

      // Start the recording with the unique file name
      await recorder.start(path.join(jsonData.RecordingsOutputFolder, fileName))

      filePath = path.join(jsonData.RecordingsOutputFolder, fileName)

      // Register cleanup function for SIGINT and SIGTERM
      rl.on('SIGINT', async () => {
        console.log('Caught Ctrl+C, stopping recorder...')
        await cleanup(filePath)
      })
    }

    for (let l = 1; l <= allList.length; l++) {
      const listNameSelector = await page.waitForSelector(
        'span.titleRow-mQBvegEO'
      )

      const listName = await page.evaluate(
        listBtn => listBtn.textContent,
        listNameSelector
      )

      console.log('active list name', listName)

      let compareList = allList[l - 1]

      if (listName == (process.argv[2] ? process.argv[2] : compareList)) {
      } else {
        const favListBtn = await page.$('span.titleRow-mQBvegEO') // Wait for the email input field to load

        await page.evaluate(listBtn => listBtn.click(), favListBtn)

        const firstAvailableElement = await Promise.race([
          page
            .waitForSelector(
              '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div',
              {
                visible: true,
                timeout: 60000
              }
            )
            .then(() => 'List is visible'),
          page
            .waitForSelector(
              '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)',
              {
                visible: true,
                timeout: 60000
              }
            )
            .then(() => 'open list btn is visible')
        ])

        if (firstAvailableElement == 'open list btn is visible') {
          await delay(1000)
          await page.click(
            '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)'
          )

          await delay(3000)
        } else {
          await delay(3000)
        }

        const favList = await page.$$(
          '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div'
        )

        console.log('i am total list count : ', favList.length)

        // Define the title you want to match
        let titleFound = false
        const targetTitle = process.argv[2]
        const defaultList = compareList
        // Initialize a flag to check if the title was found

        for (const fav of favList) {
          const title = await fav.evaluate(el => {
            // Find the child element with a class name that starts with "title"
            const titleElement = el.querySelector('[class^="title"]')
            return titleElement
              ? titleElement.textContent.trim()
              : 'Title not found'
          })

          console.log('list name: ', title)

          if (title === targetTitle) {
            console.log(`Found matching title: ${title}, clicking it.`)
            // Click on the title element
            await fav.evaluate(el => {
              const titleElement = el.querySelector('[class^="title"]')
              if (titleElement) {
                titleElement.click()
              }
            })
            titleFound = true // Mark that the title was found
            break // Stop the loop once the title is found and clicked
          }
        }

        // If `process.argv[2]` is not provided, handle that scenario
        if (!process.argv[2]) {
          console.log(
            'No list name provided in the command line argument , clicking default list item.'
          )
          for (const fav of favList) {
            const title = await fav.evaluate(el => {
              // Find the child element with a class name that starts with "title"
              const titleElement = el.querySelector('[class^="title"]')
              return titleElement
                ? titleElement.textContent.trim()
                : 'Title not found'
            })

            console.log('Title: ', title)

            if (title === defaultList) {
              console.log(`Found matching title: ${title}, clicking it.`)
              // Click on the title element
              await fav.evaluate(el => {
                const titleElement = el.querySelector('[class^="title"]')
                if (titleElement) {
                  titleElement.click()
                }
              })
              titleFound = true // Mark that the title was found
              break // Stop the loop once the title is found and clicked
            }
          }
          console.log('Clicked default list item.')
        }

        if (!titleFound) {
          console.log('given list not found')
          listNotFound = true
          // If no matching title was found after checking all items
          await page.evaluate(
            title => {
              alert(`No list found with the given name "${title}"`)
            },
            targetTitle ? targetTitle : defaultList
          )
          console.log('No matching title found.')
        }
      }
      timeFrameArray = getSelectors(
        process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
      )
      // Example usage:
      result = checkKeysAvailability(
        process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
      )

      await delay(3000)
      // Wait for the container to be loaded
      const containerSelector =
        'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas'
      await page.waitForSelector(containerSelector)

      // Scroll to the bottom of the container
      await page.evaluate(selector => {
        const container = document.querySelector(selector)
        container.scrollBy(0, 2000)
      }, containerSelector)

      await new Promise(resolve => setTimeout(resolve, 2000))
      const totalCompanies = await page.$$(
        'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div'
      ) // Wait for the email input field to load

      console.log('I am total companies stock count', totalCompanies.length - 2)

      if (allList.length == 1) {
        ensureDirectoryExists(jsonData.RecordingsOutputFolder)
        const currentDate = getIndianDate()
        const baseName = `${
          process.argv[2] ? process.argv[2] : allList[0]
        }-${currentDate}-${
          process.argv[3] ? process.argv[3] : jsonData.recordingTimeFrame
        }`
        const extension = '.mp4'

        // Get the next available file number
        const fileName = await getNextFileNumber(
          jsonData.RecordingsOutputFolder,
          baseName,
          extension
        )

        // Set up the screen recorder
        recorder = new PuppeteerScreenRecorder(page)

        // Start the recording with the unique file name
        await recorder.start(
          path.join(jsonData.RecordingsOutputFolder, fileName)
        )

        filePath = path.join(jsonData.RecordingsOutputFolder, fileName)

        // Register cleanup function for SIGINT and SIGTERM
        rl.on('SIGINT', async () => {
          console.log('Caught Ctrl+C, stopping recorder...')
          await cleanup(filePath)
        })
      }

      for (let i = 1; i < totalCompanies.length; i++) {
        if (result?.length > 0) {
          console.log('i am break because the timeFrame didnt exists ')
          // If no matching title was found after checking all items
          await page.evaluate(timeFrame => {
            const formattedResult = timeFrame.join(', ')
            alert(
              `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
            )
          }, result)
          break
        }

        if (listNotFound) {
          console.log('i am break because list is not exists ')
          break
        }
        if (i == totalCompanies.length - 1) {
          continue
        }

        if (i > 1) {
          await new Promise(resolve =>
            setTimeout(resolve, jsonData.recordingIntervalDelay)
          )
        }
        const stockComany = await page.waitForSelector(
          `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
            i + 1 == totalCompanies.length ? i : i + 1
          })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
        )
        // await page.evaluate(element => element.click(), stockComany)
        await page.click(
          `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
            i + 1 == totalCompanies.length ? i : i + 1
          })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
          { clickCount: 2 }
        )

        await delay(500)
        // await page.evaluate(element => element.click(), stockComany)
        await page.click(
          `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
            i + 1 == totalCompanies.length ? i : i + 1
          })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
          { clickCount: 2 }
        )

        await delay(3000)
        const stockPriceSelector =
          'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9'
        const notAvailableSelector = 'span.invalid-lu2ARROZ'

        const startTime = Date.now()

        while (Date.now() - startTime < TIMEOUT) {
          try {
            const firstAvailableElement = await Promise.race([
              page
                .waitForSelector(stockPriceSelector, {
                  visible: true,
                  timeout: 60000
                })
                .then(() => 'Stock Price Available'),
              page
                .waitForSelector(notAvailableSelector, {
                  visible: true,
                  timeout: 60000
                })
                .then(() => 'invalid symbol')
            ])

            if (firstAvailableElement) {
              let textContent
              if (firstAvailableElement == 'Stock Price Available') {
                const element = await page.$(stockPriceSelector)
                textContent = await page.evaluate(
                  el => el.textContent.trim(),
                  element
                )
              } else if (firstAvailableElement == 'invalid symbol') {
                const notAvailable = await page.$(notAvailableSelector)
                textContent = await page.evaluate(
                  el => el.textContent.trim(),
                  notAvailable
                )
              }

              // Check if textContent is a number
              if (
                !isNaN(parseFloat(textContent)) ||
                textContent == 'Invalid symbol'
              ) {
                const stock = await page.$(
                  'div.titleWrapper-l31H9iuA.mainTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button'
                )
                const currentStock = await page.evaluate(
                  el => el.textContent.trim(),
                  stock
                )

                console.log(
                  `Current Stock Name:${currentStock} and  Price: ${textContent}`
                )
                break // Exit loop if a number is found
              } else {
                console.log(`Not a number: ${textContent}`)
              }
            } else {
              console.log('Element not found')
            }
          } catch (error) {
            console.log('i am not available, stock price')
          }

          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL)) // Wait before the next check
        }
        if (i == 1) {
          await clickAdjBtn(page)
        }
        for (let time = 0; time < timeFrameArray.length; time++) {
          const timeSelector = await page.waitForSelector(
            '#header-toolbar-intervals > button > div > div'
          )

          const currenTime = await page.evaluate(
            time => time.innerHTML.trim(),
            timeSelector
          )

          if (
            currenTime ==
              (process.argv[3]
                ? convertTimeFrame(process.argv[3])
                : convertTimeFrame(jsonData.recordingTimeFrame)) &&
            time == 0
          ) {
            continue
          }
          if (time > 0) {
            await new Promise(resolve =>
              setTimeout(resolve, jsonData.waitingTime)
            )
          } else {
            await delay(2000)
          }
          const timeFrameBtn = await page.waitForSelector(
            '#header-toolbar-intervals > button > div > div'
          ) // Wait for the email input field to load
          await page.evaluate(element => element.click(), timeFrameBtn)

          const timeFrame = await page.waitForSelector(timeFrameArray[time])
          // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
          await delay(1000)

          await page.evaluate(element => element.click(), timeFrame)
        }
      }
    }

    return [recorder, filePath]
  } catch (error) {
    console.log(error)
    await cleanup(filePath)
  }
}

//////////////////////////////////////////////
//////////////////////////////////////////////
/// Time Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function TimeFunction (
  page,
  jsonData,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT
) {
  let result
  let timeFrameArray
  let invalidSymbol = false
  await delay(2000)

  const allList = jsonData.lists

  for (let l = 1; l <= allList.length; l++) {
    const listNameSelector = await page.$('span.titleRow-mQBvegEO')

    const listName = await page.evaluate(
      listBtn => listBtn.textContent,
      listNameSelector
    )

    console.log('i am active list name', listName)

    function getSelectors (key1, key2, key3) {
      const result = [
        timeFramesSelectors[key1],
        timeFramesSelectors[key2],
        timeFramesSelectors[key3]
      ]

      return result
    }

    function checkKeysAvailability (...keys) {
      let missingKeys = []

      // Iterate over each provided key
      keys.forEach(key => {
        if (!(key in timeFramesSelectors)) {
          missingKeys.push(key) // Add to missingKeys if the key is not found
        }
      })

      // Return the missing keys or null if all keys are found
      return missingKeys.length > 0 ? missingKeys : []
    }

    console.log('this is list ', jsonData.lists)
    console.log('i am total list length', jsonData.lists.length)

    let compareList = allList[l - 1]

    if (listName == (process.argv[2] ? process.argv[2] : compareList)) {
    } else {
      const favListBtn = await page.$('span.titleRow-mQBvegEO') // Wait for the email input field to load

      await page.evaluate(listBtn => listBtn.click(), favListBtn)

      const firstAvailableElement = await Promise.race([
        page
          .waitForSelector(
            '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div',
            {
              visible: true,
              timeout: 60000
            }
          )
          .then(() => 'List is visible'),
        page
          .waitForSelector(
            '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)',
            {
              visible: true,
              timeout: 60000
            }
          )
          .then(() => 'open list btn is visible')
      ])

      if (firstAvailableElement == 'open list btn is visible') {
        await delay(1000)
        await page.click(
          '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)'
        )

        await delay(3000)
      } else {
        await delay(3000)
      }

      const favList = await page.$$(
        '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div'
      )

      console.log('i am total list count : ', favList.length)

      // Define the title you want to match
      const targetTitle = process.argv[2]
      const defaultList = compareList
      // Initialize a flag to check if the title was found
      let titleFound = false

      for (const fav of favList) {
        const title = await fav.evaluate(el => {
          // Find the child element with a class name that starts with "title"
          const titleElement = el.querySelector('[class^="title"]')
          return titleElement
            ? titleElement.textContent.trim()
            : 'Title not found'
        })

        console.log('list name: ', title)

        if (title === targetTitle) {
          console.log(`Found matching title: ${title}, clicking it.`)
          // Click on the title element
          await fav.evaluate(el => {
            const titleElement = el.querySelector('[class^="title"]')
            if (titleElement) {
              titleElement.click()
            }
          })
          titleFound = true // Mark that the title was found
          break // Stop the loop once the title is found and clicked
        }
      }

      // If `process.argv[2]` is not provided, handle that scenario
      if (!process.argv[2]) {
        console.log('No title provided, clicking default list item.')
        for (const fav of favList) {
          const title = await fav.evaluate(el => {
            // Find the child element with a class name that starts with "title"
            const titleElement = el.querySelector('[class^="title"]')
            return titleElement
              ? titleElement.textContent.trim()
              : 'Title not found'
          })

          console.log('List name: ', title)

          if (title === defaultList) {
            console.log(`Found matching title: ${title}, clicking it.`)
            // Click on the title element
            await fav.evaluate(el => {
              const titleElement = el.querySelector('[class^="title"]')
              if (titleElement) {
                titleElement.click()
              }
            })
            titleFound = true // Mark that the title was found
            break // Stop the loop once the title is found and clicked
          }
        }
        console.log('Clicked default list item.')
      }

      if (!titleFound) {
        listNotFound = true
        // If no matching title was found after checking all items
        await page.evaluate(
          title => {
            alert(`No list found with the given name "${title}"`)
          },
          targetTitle ? targetTitle : defaultList
        )
        console.log('No matching title found.')
      }
    }
    timeFrameArray = getSelectors(
      jsonData.timeFrame1,
      jsonData.timeFrame2,
      jsonData.timeFrame3
    )
    // Example usage:
    result = checkKeysAvailability(
      jsonData.timeFrame1,
      jsonData.timeFrame2,
      jsonData.timeFrame3
    )

    await new Promise(resolve => setTimeout(resolve, 3000))
    // Wait for the container to be loaded
    const containerSelector =
      'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas'
    await page.waitForSelector(containerSelector)

    // Scroll to the bottom of the container
    await page.evaluate(selector => {
      const container = document.querySelector(selector)
      container.scrollBy(0, 2000)
    }, containerSelector)

    await new Promise(resolve => setTimeout(resolve, 2000))
    const totalCompanies = await page.$$(
      'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div'
    ) // Wait for the email input field to load

    console.log('I am total companies stock count', totalCompanies.length - 2)

    for (let i = 1; i < totalCompanies.length; i++) {
      if (result?.length > 0) {
        // If no matching title was found after checking all items
        await page.evaluate(timeFrame => {
          const formattedResult = timeFrame.join(', ')
          alert(
            `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
          )
        }, result)
        break
      }

      if (listNotFound) {
        console.log('List not found')
        break
      }
      if (i == totalCompanies.length - 1) {
        continue
      }

      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, jsonData.waitingTime))
      }
      const stockComany = await page.waitForSelector(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
      )
      // await page.evaluate(element => element.click(), stockComany)
      await page.click(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
        { clickCount: 2 }
      )

      await delay(500)
      // await page.evaluate(element => element.click(), stockComany)
      await page.click(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
        { clickCount: 2 }
      )

      await new Promise(resolve => setTimeout(resolve, 3000))
      const stockPriceSelector =
        'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9'
      const notAvailableSelector = 'span.invalid-lu2ARROZ'

      const startTime = Date.now()

      while (Date.now() - startTime < TIMEOUT) {
        try {
          const firstAvailableElement = await Promise.race([
            page
              .waitForSelector(stockPriceSelector, {
                visible: true,
                timeout: 60000
              })
              .then(() => 'Stock Price Available'),
            page
              .waitForSelector(notAvailableSelector, {
                visible: true,
                timeout: 60000
              })
              .then(() => 'invalid symbol')
          ])

          if (firstAvailableElement) {
            let textContent
            if (firstAvailableElement == 'Stock Price Available') {
              const element = await page.$(stockPriceSelector)
              textContent = await page.evaluate(
                el => el.textContent.trim(),
                element
              )
            } else if (firstAvailableElement == 'invalid symbol') {
              const notAvailable = await page.$(notAvailableSelector)
              textContent = await page.evaluate(
                el => el.textContent.trim(),
                notAvailable
              )
            }

            // Check if textContent is a number
            if (
              !isNaN(parseFloat(textContent)) ||
              textContent == 'Invalid symbol'
            ) {
              if (textContent == 'Invalid symbol') {
                invalidSymbol = true
              }
              const stock = await page.$(
                'div.titleWrapper-l31H9iuA.mainTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button'
              )
              const currentStock = await page.evaluate(
                el => el.textContent.trim(),
                stock
              )

              console.log(
                `Current Stock Name:${currentStock} and  Price: ${textContent}`
              )
              break // Exit loop if a number is found
            } else {
              console.log(`Not a number: ${textContent}`)
            }
          } else {
            console.log('Element not found')
          }
        } catch (error) {
          console.log('i am not available, stock price')
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL)) // Wait before the next check
      }
      if (i == 1) {
        await clickAdjBtn(page)
      }
      for (let time = 0; time < timeFrameArray.length; time++) {
        if (invalidSymbol) {
          console.log('break, invalid symbol')
          invalidSymbol = false
          break
        }
        const timeSelector = await page.waitForSelector(
          '#header-toolbar-intervals > button > div > div'
        )

        const currenTime = await page.evaluate(
          time => time.innerHTML.trim(),
          timeSelector
        )

        console.log(
          'I am current time of loop ',
          currenTime,
          time,
          convertTimeFrame(timeFrameArray[time])
        )

        if (
          currenTime ==
            (process.argv[3]
              ? convertTimeFrame(process.argv[3])
              : convertTimeFrame(jsonData.timeFrame1)) &&
          time == 0
        ) {
          continue
        }
        if (time > 0) {
          await new Promise(resolve =>
            setTimeout(resolve, jsonData.waitingTime)
          )
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        const timeFrameBtn = await page.waitForSelector(
          '#header-toolbar-intervals > button > div > div'
        ) // Wait for the email input field to load
        await page.evaluate(element => element.click(), timeFrameBtn)

        const timeFrame = await page.waitForSelector(timeFrameArray[time])
        // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
        await new Promise(resolve => setTimeout(resolve, 1000))

        await page.evaluate(element => element.click(), timeFrame)
        if (time == timeFrameArray.length - 1) {
          await delay(3000)
        }
      }
    }
  }
}

//////////////////////////////////////////////
//////////////////////////////////////////////
/// Keyboard Function
/////////////////////////////////////////////
/////////////////////////////////////////////

export async function KeyboardFunction (
  page,
  jsonData,
  listNotFound,
  POLL_INTERVAL,
  TIMEOUT,
  nextCompany,
  previousCompany,
  nextCompanyItteration,
  waitForSpaceBar
) {
  let result
  let timeFrameArray
  const allLists = jsonData.lists
  await delay(1000)

  const listNameSelector = await page.waitForSelector('span.titleRow-mQBvegEO')

  const listName = await page.evaluate(
    listBtn => listBtn.textContent,
    listNameSelector
  )

  console.log('Current list name', listName)

  function getSelectors (key1, key2, key3) {
    const result = [
      timeFramesSelectors[key1],
      timeFramesSelectors[key2],
      timeFramesSelectors[key3]
    ]

    return result
  }

  function checkKeysAvailability (...keys) {
    let missingKeys = []

    // Iterate over each provided key
    keys.forEach(key => {
      if (!(key in timeFramesSelectors)) {
        missingKeys.push(key) // Add to missingKeys if the key is not found
      }
    })

    // Return the missing keys or null if all keys are found
    return missingKeys.length > 0 ? missingKeys : []
  }

  if (listName == (process.argv[2] ? process.argv[2] : allLists[0])) {
  } else {
    const favListBtn = await page.$('span.titleRow-mQBvegEO') // Wait for the email input field to load

    await page.evaluate(listBtn => listBtn.click(), favListBtn)

    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(
          '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div',
          {
            visible: true,
            timeout: 60000
          }
        )
        .then(() => 'List is visible'),
      page
        .waitForSelector(
          '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)',
          {
            visible: true,
            timeout: 60000
          }
        )
        .then(() => 'open list btn is visible')
    ])

    if (firstAvailableElement == 'open list btn is visible') {
      await delay(1000)
      await page.click(
        '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(11)'
      )

      await delay(3000)
    } else {
      await delay(3000)
    }

    const favList = await page.$$(
      '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div'
    )

    console.log('i am total list count : ', favList.length)

    // Define the title you want to match
    const targetTitle = process.argv[2]
    const defaultList = allLists[0]
    // Initialize a flag to check if the title was found
    let titleFound = false

    for (const fav of favList) {
      const title = await fav.evaluate(el => {
        // Find the child element with a class name that starts with "title"
        const titleElement = el.querySelector('[class^="title"]')
        return titleElement
          ? titleElement.textContent.trim()
          : 'Title not found'
      })

      console.log('list name: ', title)

      if (title === targetTitle) {
        console.log(`Found matching title: ${title}, clicking it.`)
        // Click on the title element
        await fav.evaluate(el => {
          const titleElement = el.querySelector('[class^="title"]')
          if (titleElement) {
            titleElement.click()
          }
        })
        titleFound = true // Mark that the title was found
        break // Stop the loop once the title is found and clicked
      }
    }

    // If `process.argv[2]` is not provided, handle that scenario
    if (!process.argv[2]) {
      console.log('No title provided, clicking default list item.')
      for (const fav of favList) {
        const title = await fav.evaluate(el => {
          // Find the child element with a class name that starts with "title"
          const titleElement = el.querySelector('[class^="title"]')
          return titleElement
            ? titleElement.textContent.trim()
            : 'Title not found'
        })

        console.log('list name: ', title)

        if (title === defaultList) {
          console.log(`Found matching title: ${title}, clicking it.`)
          // Click on the title element
          await fav.evaluate(el => {
            const titleElement = el.querySelector('[class^="title"]')
            if (titleElement) {
              titleElement.click()
            }
          })
          titleFound = true // Mark that the title was found
          break // Stop the loop once the title is found and clicked
        }
      }
      console.log('Clicked default list item.')
    }

    if (!titleFound) {
      listNotFound = true
      // If no matching title was found after checking all items
      await page.evaluate(
        title => {
          alert(`No list found with the given name "${title}"`)
        },
        targetTitle ? targetTitle : defaultList
      )
      console.log('No matching title found.')
    }
  }
  timeFrameArray = getSelectors(
    jsonData.timeFrame1,
    jsonData.timeFrame2,
    jsonData.timeFrame3
  )
  // Example usage:
  result = checkKeysAvailability(
    jsonData.timeFrame1,
    jsonData.timeFrame2,
    jsonData.timeFrame3
  )

  await new Promise(resolve => setTimeout(resolve, 3000))
  // Wait for the container to be loaded
  const containerSelector =
    'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas'
  await page.waitForSelector(containerSelector)

  // Scroll to the bottom of the container
  await page.evaluate(selector => {
    const container = document.querySelector(selector)
    container.scrollBy(0, 2000)
  }, containerSelector)

  await new Promise(resolve => setTimeout(resolve, 2000))

  const totalCompanies = await page.$$(
    'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div > div'
  ) // Wait for the email input field to load

  console.log('I am total companies stocks count', totalCompanies.length - 2)

  for (let i = 1; i < totalCompanies.length; i++) {
    if (result?.length > 0) {
      // If no matching title was found after checking all items
      await page.evaluate(timeFrame => {
        const formattedResult = timeFrame.join(', ')
        alert(
          `Wrong timefrmae is mentioned in the config file "${formattedResult}"`
        )
      }, result)
      break
    }
    if (listNotFound) {
      console.log('Break, List not found')
      break
    }
    if (
      (previousCompany && i == 1) ||
      (nextCompanyItteration && i == totalCompanies.length - 2)
    ) {
      previousCompany = false
      nextCompanyItteration = false
      i--
    } else {
      // Check if the Tab key was pressed

      if (i == totalCompanies.length - 1) {
        continue
      }

      if (i > 1) {
        await page.evaluate(() => {
          document.activeElement.blur()
          document.body.focus()
        })

        if (nextCompany) {
          nextCompany = false
          previousCompany = false
          nextCompanyItteration = false
        } else {
          await waitForSpaceBar(page)
        }

        await page.evaluate(() => {
          document.activeElement.blur()
          document.body.focus()
        })
      }
      const stockComany = await page.waitForSelector(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`
      )
      // await page.evaluate(element => element.click(), stockComany)
      await page.click(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
        { clickCount: 2 }
      )
      await delay(500)
      // await page.evaluate(element => element.click(), stockComany)
      await page.click(
        `body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-watchlist > div.widgetbar-widgetbody > div > div > div > div.content-g71rrBCn > div > div > div.listContainer-MgF6KBas > div div:nth-child(${
          i + 1 == totalCompanies.length ? i : i + 1
        })  > div > div > span.cell-RsFlttSS.last-RsFlttSS`,
        { clickCount: 2 }
      )
      await new Promise(resolve => setTimeout(resolve, 1000))
      const stockPriceSelector =
        'body > div.js-rootresizer__contents.layout-with-border-radius > div.layout__area--right > div > div.widgetbar-pages > div.widgetbar-pagescontent > div.widgetbar-page.active > div.widget-X9EuSe_t.widgetbar-widget.widgetbar-widget-detail > div.widgetbar-widgetbody > div > div.wrapper-Tv7LSjUz > div.container-qWcO4bp9.widgetWrapper-BSF4XTsE.userSelectText-BSF4XTsE.offsetDisabled-BSF4XTsE > span.priceWrapper-qWcO4bp9 > span.highlight-maJ2WnzA.price-qWcO4bp9'
      const startTime = Date.now()

      while (Date.now() - startTime < TIMEOUT) {
        const element = await page.$(stockPriceSelector)

        if (element) {
          const textContent = await page.evaluate(
            el => el.textContent.trim(),
            element
          )

          // Check if textContent is a number
          if (!isNaN(parseFloat(textContent))) {
            const stock = await page.$(
              'div.titleWrapper-l31H9iuA.mainTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button'
            )
            const currentStock = await page.evaluate(
              el => el.textContent.trim(),
              stock
            )

            console.log(
              `Current Stock Name:${currentStock} and  Price: ${textContent}`
            )
            break // Exit loop if a number is found
          } else {
            console.log(`Not a number: ${textContent}`)
          }
        } else {
          console.log('Element not found')
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL)) // Wait before the next check
      }
      if (i == 1) {
        await clickAdjBtn(page)
      }

      for (let time = 0; time < timeFrameArray.length; time++) {
        const timeSelector = await page.waitForSelector(
          'div.titleWrapper-l31H9iuA.intervalTitle-l31H9iuA.apply-overflow-tooltip.withDot-l31H9iuA.apply-common-tooltip.withAction-l31H9iuA > button'
        )

        const currenTime = await page.evaluate(
          time => time.textContent,
          timeSelector
        )

        if (currenTime == jsonData.timeFrame1 && time == 0) {
          continue
        }

        if (time > 0) {
          await page.evaluate(() => {
            document.activeElement.blur()
            document.body.focus()
          })
          const keyResult = await waitForSpaceBar(page)
          // If Tab is pressed, break the loop
          if (keyResult.key === 'Tab') {
            if (i == totalCompanies.length - 2) {
              await page.evaluate(() => {
                alert(
                  "We can't go to the next stock because we are on the last stock"
                )
              })
              nextCompanyItteration = true
              i = i - 1
              break
            } else {
              nextCompany = true
              break // Skip to the next iteration of the parent loop
            }
          } else if (keyResult.key === 'Control') {
            if (i === 1) {
              // Check some condition after the action
              await page.evaluate(() => {
                alert(
                  "We can't go to the previous stock because we are on the first stock"
                )
              })
              previousCompany = true
              i = i - 1
              break
            } else {
              nextCompany = true
              i = i - 2
              break // Skip to the next iteration of the parent loop
            }
          }
          await page.evaluate(() => {
            document.activeElement.blur()
            document.body.focus()
          })
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        const timeFrameBtn = await page.waitForSelector(
          '#header-toolbar-intervals > button > div > div'
        ) // Wait for the email input field to load
        await page.evaluate(element => element.click(), timeFrameBtn)

        const timeFrame = await page.waitForSelector(timeFrameArray[time])
        // const elementHTML = await page.evaluate(el => el.innerHTML, timeFrame)
        await new Promise(resolve => setTimeout(resolve, 1000))

        await page.evaluate(element => element.click(), timeFrame)
      }
    }
  }
}

////////////////////////////////////////////
////////////////////////////////////////////
//// List Input
////////////////////////////////////////////
////////////////////////////////////////////

export async function ListInput (page, listFilePath, listName) {
  await delay(2000)

  const listChunksPaths = await splitFileIntoChunks(listFilePath, 20, listName)

  for (let i = 0; i < listChunksPaths.length; i++) {
    const favListBtn = await page.$('span.titleRow-mQBvegEO') // Wait for the email input field to load

    await page.evaluate(listBtn => listBtn.click(), favListBtn)

    const firstAvailableElement = await Promise.race([
      page
        .waitForSelector(
          '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div',
          {
            visible: true,
            timeout: 60000
          }
        )
        .then(() => 'List is visible'),
      page
        .waitForSelector(
          '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(8)',
          {
            visible: true,
            timeout: 60000
          }
        )
        .then(() => 'import list btn is visible')
    ])

    if (firstAvailableElement == 'import list btn is visible') {
      try {
        // Try the first selector
        const [fileChooser] = await Promise.all([
          page.waitForFileChooser({ timeout: 5000 }),
          page.click(
            '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(8)'
          )
        ])

        fileChooser.accept([listChunksPaths[i]])
      } catch (error) {
        try {
          // If the first selector fails, try the second selector
          const [fileChooser] = await Promise.all([
            page.waitForFileChooser({ timeout: 5000 }),
            page.click(
              '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(7)'
            )
          ])

          fileChooser.accept([listChunksPaths[i]])
        } catch (secondError) {
          console.error('Both selectors failed:', secondError)
          throw secondError // Re-throw error if both selectors fail
        }
      }

      await delay(2000)
    }
  }
}

////////////////////////////////////////////
////////////////////////////////////////////
//// List Delete
////////////////////////////////////////////
////////////////////////////////////////////

export async function ListDelete (page) {
  const favListBtn = await page.$('span.titleRow-mQBvegEO') // Wait for the email input field to load

  await page.evaluate(listBtn => listBtn.click(), favListBtn)

  console.log('Deleting list...')

  const firstAvailableElement = await Promise.race([
    page
      .waitForSelector(
        '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div',
        { visible: true, timeout: 60000 }
      )
      .then(() => 'List is visible')
      .catch(error => {
        console.log('Error waiting for list:', error)
        return null
      }),
    page
      .waitForSelector(
        '#overlap-manager-root > div:nth-child(2) > span > div.watchlistMenu-mQBvegEO.menuWrap-Kq3ruQo8 > div > div > div:nth-child(8)',
        { visible: true, timeout: 60000 }
      )
      .then(() => 'open list btn is visible')
      .catch(error => {
        console.log('Error waiting for open list btn (11):', error)
        return null
      })
  ])

  console.log('available element: ', firstAvailableElement)

  if (firstAvailableElement == 'open list btn is visible') {
    await delay(1000)
    const divs = await page.$$('div.watchlistMenu-mQBvegEO > div > div > div') // Select all div elements

    for (const div of divs) {
      // Get the span inside the current div
      const spanText = await div
        .$eval('span.labelRow-jFqVJoPk > span', el => el.textContent)
        .catch(() => null) // Handle cases where span might not exist

      if (spanText) {
        console.log('Span text: ', spanText)
      }

      if (spanText && spanText.includes('Open list')) {
        console.log('Clicking on div with span text: Open list...')
        await div.click() // Click the div if the span's text matches
        break // Exit the loop after the first match (optional)
      }
    }

    await delay(3000)
  } else {
    await delay(3000)
  }

  const favList = await page.$$(
    '#overlap-manager-root > div:nth-child(2) > div > div.dialog-qyCw0PaN.dialog-b8SxMnzX.dialog-XuENC387.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div.wrapper-nGEmjtaX > div.dialogContent-XuENC387 > div > div > div > div > div'
  )

  console.log('i am total list count : ', favList.length)

  // Define the title you want to match
  const targetTitle = process.argv[3]
  // Initialize a flag to check if the title was found
  let titleFound = false

  for (const fav of favList) {
    const title = await fav.evaluate(el => {
      // Find the child element with a class name that starts with "title"
      const titleElement = el.querySelector('[class^="title"]')
      return titleElement ? titleElement.textContent.trim() : 'Title not found'
    })

    console.log('list name: ', title)

    if (title === targetTitle) {
      console.log(`Found matching title: ${title}, clicking it.`)
      // Click on the title element
      await fav.evaluate(el => {
        const titleElement = el.querySelector(
          '[class^="controls"] span[data-name="remove-button"]'
        )
        if (titleElement) {
          titleElement.click()
        }
      })

      await delay(2000)
      // Now, outside of the browser context, click the "Yes" button
      await page.evaluate(() => {
        const yesBtn = document.querySelector(
          '#overlap-manager-root > div:nth-child(2) > div > div:nth-child(3) > div > div > div.dialog-qyCw0PaN.popupDialog-B02UUUN3.dialog-aRAWUDhF.rounded-aRAWUDhF.shadowed-aRAWUDhF > div > div > div.footer-B02UUUN3 > button.actionButton-k53vexPa.button-D4RPB3ZC.small-D4RPB3ZC.green-D4RPB3ZC.primary-D4RPB3ZC.apply-overflow-tooltip.apply-overflow-tooltip--check-children-recursively.apply-overflow-tooltip--allow-text.apply-common-tooltip'
        )

        if (yesBtn) {
          yesBtn.click()
        }
      })

      titleFound = true // Mark that the title was found
      break // Stop the loop once the title is found and clicked
    }
  }
  await delay(4000)

  if (!titleFound) {
    // If no matching title was found after checking all items
    await page.evaluate(title => {
      alert(`No list found with the given name "${title}"`)
    }, targetTitle)
    console.log('No matching title found.')
  }
}
