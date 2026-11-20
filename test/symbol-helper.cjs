async function chooseSymbol(page,subject,label){await page.locator({math:'#symbol-search-open',chemistry:'#chemistry-symbols-open',biology:'#biology-symbols-open'}[subject]).click();await page.locator('#symbol-query').fill(label);await page.locator('[data-symbol-name='+JSON.stringify(label)+']').click();}
module.exports={chooseSymbol};
