(()=>{
    const MAX_GROUPS = 5
    const MIN_VALUE = 12
    const HIGH_ROLL_OF = 18
    var rollLimiter = 50
    
    function getElementsByXPath(xpath, context=document){ //console.trace("in getElementsByXPath: ",arguments)
        let results = []
        let nodes = document.evaluate(xpath, context, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        //console.debug(nodes)
        while(element = nodes.iterateNext()){
            //console.debug(element)
            results.push(element)
        }

        if(results.length < 1){
            console.warn("No Results Found for: ", xpath, context)
        }

        return results;
    }

    function getGroups(){ //console.trace("in getGroups: ",arguments)
        let selector = ".ddbc-dice-roll-group"
        return document.querySelectorAll(selector)
    }

    function getGroup( val=0 ){ //console.trace("in getGroup: ",arguments)
        let groups = getGroups()

        if(typeof val === 'number'){
            if( val < groups.length ){
                return groups[val]
            }
        }
        else if(groups.length > 0){
            for( var group of groups.values() ){
                if(group === val){
                    return val
                }
            }
        }

        console.error("Can't find group: ",val)
        throw new Error("Can't find group: "+val)
    }

    function getRolls( group=undefined ){ //console.trace("in getRolls: ",arguments)
        let selector = ".ddbc-dice-roll"
        let context = document

        if(group){
            context = getGroup(group)
        }

        return context.querySelectorAll(selector)
    }

    function getRoll( group=undefined, val=0 ){ //console.log("in getRoll: ",arguments)
        group = getGroup(group)
        var rolls = getRolls(group)

        if(typeof val === 'number'){
            if(val < rolls.length){
                return rolls[val]
            }
        }
        else if(rolls.length > 0){
            for( var roll of rolls.values() ){
                if(roll === val){
                    return val
                }
            }
        }

        console.error("Can't find roll: ",val)
        throw new Error("Can't find roll")
    }

    function getRollTotal( group=null, roll=null ){ //console.trace("in getRollTotal: ",arguments)
        group = getGroup(group)
        roll = getRoll(group, roll)
        let totalSelector = ".ddbc-dice-roll__total"

        return parseInt( roll.querySelector(totalSelector).textContent )
    }

    function getRollDieValues( group=null, roll=null ){ //console.trace("in getRollDieValues: ",arguments)
        group = getGroup(group)
        roll = getRoll(group, roll)
        let dieValueSelector = ".ddbc-dice-roll__dice-value"
        let values = []

        for( let die of roll.querySelectorAll(dieValueSelector).values() ){
            values.push( parseInt(die.textContent) )
        }

        return values
    }

    function addGroup(){ //console.trace("in addGroup: ",arguments)
        let xpath = "//span[text()='+Add Group']/.."
        let button = getElementsByXPath(xpath)[0]

        button.click()
        console.info("Added Group")

        return getGroup(0)
    }

    function resetGroup( group=null ){ //console.trace("in resetGroup: ",arguments)
        group = getGroup(group)
        let xpath = "//span[text()='Reset Group']/.."
        let button = getElementsByXPath(xpath, group)[0]

        button.click()
        button.click()
        console.info("Reset Group")
    }

    function validateRoll(group=null, roll=null){ //console.trace("in validateRoll: ",arguments)
        group = getGroup(group)
        roll = getRoll(group, roll)
        let total = getRollTotal(group, roll)
        let dieValues = getRollDieValues(group, roll)
        let pass = total >= MIN_VALUE

        if(!pass){
            console.info("Failed roll("+total+")")
        }

        return pass
    }
    
    function rollDice( group=null, roll=null, callback=undefined ){ //console.trace("in rollDice: ",arguments)
        group = getGroup(group)
        roll = getRoll(group, roll)
        let xpath = "//span[text()='Roll']/.."
        let button = getElementsByXPath(xpath, roll)[0]

        if( rollLimiter === null || rollLimiter-- > 0){
            button.click()
            console.info("Rolled Dice")

            setTimeout(()=>{
                let passCheck = validateRoll(group, roll)

                if(callback && callback instanceof Function){
                    callback(passCheck, group, roll)
                }
            }, 4000)
        } else {
            console.log("Roll Limit reached")
        }
    }

    function validateGroup(group=null){ //console.trace("in validateGroup: ",arguments)
        group = getGroup(group)
        let rolls = getRolls(group)
        let pass = false

        for(let roll of rolls){
            let total = getRollTotal(group, roll)
            if(total >= HIGH_ROLL_OF){
                pass = true
                break
            }
        }

        if(!pass){
            console.info("Failed group validate")
        }

        return pass
    }
    
    function checkRoll(callback, nextRollIndex, pass, group, roll) {
        let rolls = getRolls(group)

        if( !pass ){
            resetGroup(group)
            nextRollIndex = 0
        } 
        else {
            nextRollIndex += 1
        }

        if(nextRollIndex < rolls.length){
            rollDice(group, nextRollIndex, checkRoll)
        }
        else {
            let passCheck = validateGroup(group)

            if(callback && callback instanceof Function){
                callback(passCheck, group)
            }
        }
    }

    function rollGroup(group=undefined, nextRollIndex=0, callback=undefined){ console.debug("in rollGroup: ",arguments)
        group = getGroup(group)

        rollDice(group, nextRollIndex, checkRoll.bind(this, callback, nextRollIndex))
    }
    
    function checkGroup(maxGroups, pass, group){
        if( !pass ){
            resetGroup(group)
            rollGroup(group, 0)
        } 
        else if(getGroups().length < maxGroups) {
            addGroup()
            run(maxGroups)
        }
    }

    function run(maxGroups=1){ console.debug("in run: ",arguments)
        rollGroup(0, 0, checkGroup.bind(this, maxGroups))
    }
    
    run(MAX_GROUPS)
})()
