var holidayObj = {
    holiday: "",
    lastCheck: null,
    holidays: {
        Eggy: {
            check: function(day, month){
                if (month == 3) return true;
            }
        },
        Pumpkimp: {
            check: function(day, month){
                if (month == 9 || (month == 10 && day <= 5)) return true;
            }
        },
        Snowy: {
            check: function(day, month){
                if ((month == 11 && day >= 15) || (month == 0 && day <= 15)) return true;
            }
        }
    },
    checkActive: function(name){
        return (this.holiday == name);
    },
    checkAll: function(){
        var date = new Date();
        if (this.lastCheck != null && ((date.getTime() - this.lastCheck.getTime()) < 120000)) return;
        this.lastCheck = date;
        var day = date.getUTCDate();
        var month = date.getUTCMonth();
        for (var holiday in this.holidays){
            if (this.holidays[holiday].check(day, month)){
                if (!this.holiday){
                    message("Loaded " + holiday + " event!", "Notices");
                }
                this.holiday = holiday;
                return;
            }
        }
        if (this.holiday){
            message(this.holiday + " event has come to an end!", "Notices");
        }
        this.holiday = "";
        return;
    }
}

var alchObj = {
    tab: document.getElementById('alchemyTab'),
    load: function(){
        if (game.global.potionData != null) this.potionsOwned = game.global.potionData;
        if (game.global.potionAuto != null) this.potionAuto = game.global.potionAuto;
        if (this.potionsOwned.length < this.potionNames.length){
            var need = this.potionNames.length - this.potionsOwned.length;
            for (var x = 0; x < need; x++){
                this.potionsOwned.push(0);
                this.potionAuto.push(0);
            }
        }
        this.tab.style.display = (game.global.alchemyUnlocked || game.global.challengeActive == "Alchemy") ? 'table-cell' : 'none';
        this.unlock();
    },
    rewards: {
        Metal: "Potatoes",
        Wood: "Mushrooms",
        Food: "Seaweed",
        Gems: "Firebloom",
        Any: "Berries",
    },
    potionNames: ["Herby Potion", "Potion of Finding", "Gaseous Potion", "Potion of the Void", "Potion of Strength", "Elixir of Crafting", "Elixir of Finding", "Elixir of Accuracy"],
    potionsOwned: [0,0,0,0,0,0,0,0],
    potionAuto: [0,0,0,0,0,0,0,0],
    getRunetrinketMult: function(chance){
        var notFind = 100 - chance;
        notFind *= Math.pow(0.95, this.potionsOwned[1]);
        return (100 - notFind);
    },
    getRunetrinketBonusAmt: function(){
        var world = (game.global.world < 101) ? 101 : game.global.world;
        var orig = game.portal.Observation.getDropChance(world);
        var newMult = this.getRunetrinketMult(orig);
        return newMult - orig;
    },
    potions: [
        {
            challenge: true,
            cost: [["Potatoes",5,10]],
            description: "Increases all Herbs found by 500%. <span class='red'>Increases Enemy Attack/Health by 10% (compounding)</span>",
            effectText: "+#% Herbs found",
            enemyMult: 1.1,
            effect: 5,
        },
        {
            challenge: true,
            cost: [["Mushrooms",5,4]],
            description: "Increases all non-radon resources earned by 25% additively. Reduces chance to not find a Runetrinket by 5% (compounding). <span class='red'>Increases the cost of all other Potions by 50% (compounding)</span>",
            effectText: "+#% res",
            effect: 0.25,
        },
        {
            challenge: true,
            cost: [["Seaweed",5,10]],
            description: "Increases all Radon gained by 10% (compounding). <span class='red'>Increases Enemy Attack/Health by 30% (compounding)</span>",
            effectText: "+#% Radon",
            enemyMult: 1.3,
            effectComp: 1.10,
        },
        {
            challenge: true,
            cost: [["Firebloom",5,4]],
            description: "Nullifies 5% (compounding) of increased enemy stats from Elixirs while in Void Maps. <span class='red'>Increases the cost of all other Potions by 50% (compounding)</span>",
            effectText: "#% nullified void stats",
            effectComp: 0.95,
            inverseComp: true
        },
        {
            challenge: true,
            cost: [["Berries",5,4]],
            description: "Increases Trimp Attack/Health by 15% additively. <span class='red'>Increases the cost of all other Potions by 50% (compounding)</span>",
            effectText: "+#% Stats",
            effect: 0.15,
        },
        {
            challenge: false,
            cost: [["Potatoes",2000,4],["Berries",1000,4],["Seaweed",1000,4]],
            description: "Increases all housing by 5% (compounding).",
            effectText: "+#% housing",
            effectComp: 1.05,
        },
        {
            challenge: false,
            cost: [["Mushrooms",10000,4],["Potatoes",3000,4]],
            description: "Increases all non-radon resources by 5% (compounding).",
            effectText: "+#% resources",
            effectComp: 1.05,
        },
        {
            challenge: false,
            cost: [["Firebloom",7000,4],["Seaweed",3000,4]],
            description: "Increases Crit Damage by 25%.",
            effectText: "+#% Crit Damage",
            effect: 0.25,
        }
    ],
    allPotionGrowth: 1.5,
    getPotionCost: function(potionName, getText){
        var index = this.potionNames.indexOf(potionName);
        if (index == -1) return "";
        var potion = this.potions[index];
        var cost = potion.cost;
        var costObj = [];
        var costText = "";
        var owned = 0;
        var thisOwned = this.potionsOwned[index];
        if (potion.challenge && !potion.enemyMult){
            for (var y = 0; y < this.potionsOwned.length; y++){
                if (this.potions[y].challenge != (game.global.challengeActive == "Alchemy")) continue;
                if (y != index && !this.potions[y].enemyMult) owned += this.potionsOwned[y]; //no cost increase for enemyMult potions
            }
        }
        for (var x = 0; x < cost.length; x++){
            var thisCost = Math.ceil(cost[x][1] * Math.pow(cost[x][2], thisOwned));
            if (potion.challenge) thisCost *= Math.pow(this.allPotionGrowth, owned);
            if (getText){
                var ownedName = (game.global.challengeActive == "Alchemy") ? "cowned" : "owned";
                var color = (game.herbs[cost[x][0]][ownedName] < thisCost) ? "red" : "green";
                costText += "<span class='" + color + "'>" + prettify(thisCost) + " " + cost[x][0] + "</span>";
                if (cost.length == x + 2){
                    if (cost.length > 2) costText += ",";
                    costText += " and ";
                }
                else if (cost.length != x + 1) costText += ", ";
            }
            else costObj.push([cost[x][0], thisCost]);
        }
        if (getText) return costText;
        return costObj;
    },
    getPotionEffect: function(potionName){
        if (game.global.universe != 2) return 1;
        var index = this.potionNames.indexOf(potionName);
        if (index == -1) return 1;
        var potion = this.potions[index];
        var onChallenge = (game.global.challengeActive == "Alchemy");
        if (potion.challenge && !onChallenge) return 1;
        if (!potion.effect && !potion.effectComp) return 1;
        var owned = this.potionsOwned[index];
        if (potion.effect) return 1 + (potion.effect * owned);
        return Math.pow(potion.effectComp, owned);

    },
    getRadonMult: function(){
        var base = 51;
        base *= this.getPotionEffect("Gaseous Potion");
        return base;
    },
    getPotionCount: function(potionName){
        return this.potionsOwned[this.potionNames.indexOf(potionName)];
    },
    getEnemyStats: function(map, voidMap){
        //Challenge only
        var baseMod = 0.1;
        baseMod *= Math.pow(this.potions[0].enemyMult, this.potionsOwned[0]); //Herby potion
        baseMod *= Math.pow(this.potions[2].enemyMult, this.potionsOwned[2]); //Gaseous potion
        if (voidMap) {
            baseMod *= 10;
            if (this.potionsOwned[3] > 0) baseMod *= this.getPotionEffect("Potion of the Void");
            return baseMod;
        }
        if (map) return baseMod * 3;
        return baseMod;
    },
    unlock: function(){
        if (typeof game.global.messages.Loot.alchemy === 'undefined') game.global.messages.Loot.alchemy = true;
    },
    mapCleared: function(mapObj){
        if (game.global.universe != 2) return;
        if (game.global.challengeActive != "Alchemy" && !game.global.alchemyUnlocked) return;
        if (!mapObj || !mapObj.location) return;
        var resType = game.mapConfig.locations[mapObj.location].resourceType;
        if (resType == "Scaling") resType = getFarmlandsResType(mapObj);
        var resource = this.rewards[resType];
        if (!resource) return;
        var amt = this.getDropRate(mapObj.level);
        if (mapObj.location == "Farmlands") amt *= 1.5;
        if (amt <= 0) return;
        if (game.global.challengeActive == "Alchemy"){
            game.herbs[resource].cowned += amt;
            game.herbs[resource].cfound += amt;
        }
        else{
            game.herbs[resource].owned += amt;
            game.herbs[resource].found += amt;
        }
        message("You found " + prettify(amt) + " " + resource + "!", "Loot", "*leaf3", "alchemy", "alchemy");
        this.openPopup(true);
    },
    canAffordPotion: function(potionName){
        var cost = this.getPotionCost(potionName);
        if (!cost) return false;
        var owned = (game.global.challengeActive == "Alchemy") ? "cowned" : "owned";

        for (var x = 0; x < cost.length; x++){
            var resOwned = game.herbs[cost[x][0]][owned];
            if (resOwned < cost[x][1]) return false;
        }
        return true;
    },
    craftPotion: function(potionName){
        if (!this.canAffordPotion(potionName)) return;
        var cost = this.getPotionCost(potionName);
        var ownedName = (game.global.challengeActive == "Alchemy") ? "cowned" : "owned";
        for (var x = 0; x < cost.length; x++){
            game.herbs[cost[x][0]][ownedName] -= cost[x][1];
        }
        var index = this.potionNames.indexOf(potionName);
        this.potionsOwned[index]++;
        game.global.potionData = this.potionsOwned;
        this.openPopup(true);
    },
    zoneScale: 1.14,
    extraMapScale: 1.25,
    getDropRate: function(mapLevel){
        var world = game.global.world;
        var dif = mapLevel - world;
        if (dif < 0) return 0;
        var base = ((2 + (Math.floor(world / 10) * 5)) * Math.pow(this.zoneScale, world));
        base = Math.floor(base * Math.pow(this.extraMapScale, dif));
        base *= this.getPotionEffect("Herby Potion");
        return base;
    },
    openPopup: function(updateOnly){
        if (updateOnly && (lastTooltipTitle != "Alchemy" || !game.global.lockTooltip)) return; 
        var text = "<div class='alchemyTitle'>Herbs</div>";
        var ownedName = (game.global.challengeActive == "Alchemy") ? "cowned" : "owned";
        var foundName = (game.global.challengeActive == "Alchemy") ? "cfound" : "found";
        for (var herb in game.herbs){
            text += "<div class='alchemyPopupHerb'><span class='alchemyPopupName'>" + herb + "</span><br/>" + prettify(game.herbs[herb][ownedName]) + " Stored<br/>" + prettify(game.herbs[herb][foundName]) + " Found" + "</div>";
        }
        text += "<div class='alchemyTitle'>Crafts</div>";
        text += "<table id='alchemyCraftTable'><tbody><tr>"
        var count = 0;
        for (var x = 0; x < this.potions.length; x++){
            var potion = this.potions[x];
            if ((game.global.challengeActive == "Alchemy") != potion.challenge) continue;
            if (count % 5 == 0) text += "</tr><tr>";
            
            var name = this.potionNames[x];
            var effectAmt = this.getPotionEffect(name);
            if (potion.inverseComp) effectAmt = 1 - effectAmt;
            else effectAmt--;
            var effectText = prettify(this.potionsOwned[x]) + " owned, " + potion.effectText.replace("#", prettify((effectAmt) * 100));
            if (name == "Potion of Finding") effectText += ", +" + prettify(this.getRunetrinketBonusAmt()) + "% RT chance"
            var btnClass = (this.canAffordPotion(name)) ? "btn-success" : "btn-disabled";
            text += "<td class='alchemyPopupCraft'><div class='alchemyPopupName'>" + name + "</div><span onclick='alchObj.craftPotion(\"" + name + "\")' class='btn btn-sm " + btnClass + "' style='width: 80%; margin-left: 10%;'>Craft</span><br/><span class='alchemyPotionEffect'>" + effectText + "</span><br/><span class='alchemyCraftCost'>" + this.getPotionCost(name, true) + "</span><div class='alchemyAuto'>AutoCraft up to: <input value='" + this.potionAuto[x] + "' type='number' id='potionAuto" + x + "' /></div><span class='alchemyCraftDescription'>" + potion.description + "</span></td>";
            count++;
        }
        text += "</tr></tbody></table>";
        if (game.global.challengeActive == "Alchemy"){
            text += "<div class='alchemyEnemyStats'>Enemies in this dimension are enchanted, gaining +" + prettify(this.getEnemyStats(false, false) * 100) + "% enemy stats in World, +" + prettify(this.getEnemyStats(true, false) * 100) + "% in Maps, and +" + prettify(this.getEnemyStats(true, true) * 100) + "% in Void Maps. All Radon drops are increased by " + prettify((this.getRadonMult() - 1)  * 100) + "%.";
            text += "</div>";
        }
        text += "<div class='alchemyTitle'>Drop Rates</div><table id='alchemyDropsTable'><tbody>";
        var row1 = "<tr><td style='font-weight: bold'>Map Level</td>";
        var row2 = "<tr><td style='font-weight: bold'>Drop Amt</td>";
        for (var y = game.global.world - 1; y <= game.global.world + 10; y++){
            row1 += "<td>" + y + "</td>";
            row2 += "<td>" + prettify(this.getDropRate(y)) + "</td>";
        }
        text += row1 + "</tr>" + row2 + "</tr></tbody></table>";
        if (updateOnly){
            document.getElementById('tipText').innerHTML = text;
            return;
        }
        tooltip('confirm', null, 'update', text, 'alchObj.save()', 'Alchemy', 'Save and Close')
    },
    autoCraft: function(){
        //called once every 2 seconds after alchemy is unlocked or during challenge
        var onChallenge = (game.global.challengeActive == "Alchemy");
        for (var x = 0; x < this.potions.length; x++){
            var potion = this.potions[x];
            if ((potion.challenge) != onChallenge) continue;
            if (this.potionsOwned[x] >= this.potionAuto[x]) continue;
            if (this.canAffordPotion(this.potionNames[x])) this.craftPotion(this.potionNames[x]);
        }
    },
    save: function(){
        for (var x = 0; x < this.potions.length; x++){
            var elem = document.getElementById('potionAuto' + x);
            if (!elem) continue;
            var val = elem.value;
            if (!val || isNumberBad(val)) continue;
            this.potionAuto[x] = val;
        }
        game.global.potionAuto = this.potionAuto;
    },
    portal: function(){
        for (var x = 0; x < this.potions.length; x++){
            if (this.potions[x].challenge) this.potionsOwned[x] = 0;
        }
        for (var herb in game.herbs){
            game.herbs[herb].cfound = 0;
            game.herbs[herb].cowned = 0;
        }
        if (!game.global.alchemyUnlocked) this.tab.style.display = 'none';
    }
}

var autoBattle = {
    frameTime: 300,
    speed: 1,
    enemyLevel: 1,
    maxEnemyLevel: 1,
    autoLevel: true,
    dust: 0,
    trimp: null,
    enemy: null,
    seed: 296256,
    enemiesKilled: 0,
    sessionEnemiesKilled: 0,
    sessionTrimpsKilled: 0,
    maxItems: 4,
    notes: "&nbsp;",
    popupMode: "items",
    battleTime: 0,
    lootAvg: {
        accumulator: 0,
        counter: 0
    },
    template: function(){
        return {
            level: 1,
            isTrimp: false,
            baseHealth: 50,
            health: 50,
            maxHealth: 50,
            baseAttack: 5,
            attack: 5,
            baseAttackSpeed: 5000,
            attackSpeed: 5000,
            lastAttack: 0,
            shockChance: 0,
            shockMod: 0,
            bleedChance: 0,
            bleedMod: 0,
            bleedTime: 0,
            poisonChance: 0,
            poisonTime: 0,
            poisonMod: 0,
            poisonStack: 2,
            defense: 0,
            lifesteal: 0,
            shockResist: 0,
            poisonResist: 0,
            bleedResist: 0,
            lifestealResist: 0,
            slowAura: 0,
            bleed: {
                time: 0,
                mod: 0
            },
            poison: {
                time: 0,
                mod: 0,
                lastTick: 0,
                stacks: 0
            },
            shock: {
                time: 0,
                mod: 0,
            }
        }
    },
    unlockAllItems: function(){
        for (var item in this.items){
            this.items[item].owned = true;
        }
    },
    resetAll: function(){
        this.enemyLevel = 1;
        this.maxEnemyLevel = 1;
        this.autoLevel = true;
        this.dust = 0;
        this.trimp = null;
        this.enemy = null;
        this.enemiesKilled = 0;
        this.resetStats();
        for (var item in this.items){
            item = this.items[item];
            item.owned = (item.zone) ? false : true;
            item.equipped = false;
            item.hidden = false;
            item.level = 1;
        }
        for (var bonus in this.bonuses){
            this.bonuses[bonus].level = 0;
        }
        for (var oneTimer in this.oneTimers){
            this.oneTimers[oneTimer].owned = false;
        }
    },
    save: function(){
        var data = {};
        data.enemyLevel = this.enemyLevel;
        data.dust = this.dust;
        data.enemiesKilled = this.enemiesKilled;
        data.maxEnemyLevel = this.maxEnemyLevel;
        data.autoLevel = this.autoLevel;
        data.items = {};
        for (var item in this.items){
            var thisItem = this.items[item];
            if (!thisItem.owned) continue;
            data.items[item] = {};
            var saveItem = data.items[item];    
            saveItem.equipped = thisItem.equipped;
            saveItem.owned = thisItem.owned;
            saveItem.level = thisItem.level;
            saveItem.hidden = thisItem.hidden;
        }
        data.bonuses = {};
        for (var bonus in this.bonuses){
            var thisBonus = this.bonuses[bonus];
            if (thisBonus.level == 0) continue;
            data.bonuses[bonus] = thisBonus.level;
        }
        data.oneTimers = {};
        for (var oneTimer in this.oneTimers){
            var thisOneTimer = this.oneTimers[oneTimer];
            if (!thisOneTimer.owned) continue;
            data.oneTimers[oneTimer] = true;
        }
        game.global.autoBattleData = data;
    },
    load: function(){
        var data = game.global.autoBattleData;
        var tab = document.getElementById('autoBattleTab');
        var canAb = Fluffy.checkU2Allowed();
        if (!canAb || !data || !data.items){
            this.resetAll();
            if (!canAb) tab.style.display = 'none';
            else tab.style.display = 'table-cell';
            return;
        }
        tab.style.display = 'table-cell';
        this.enemyLevel = data.enemyLevel;
        this.dust = data.dust;
        this.enemiesKilled = data.enemiesKilled;
        this.maxEnemyLevel = data.maxEnemyLevel;
        this.autoLevel = data.autoLevel;
        for (var item in this.items){
            var saveItem = data.items[item];
            var thisItem = this.items[item];
            if (!saveItem) {
                //thisItem.owned = false;
                thisItem.equipped = false;
                thisItem.level = 1;
                thisItem.hidden = false;
                continue;
            }
            
            thisItem.owned = saveItem.owned;
            thisItem.equipped = saveItem.equipped;
            thisItem.level = saveItem.level;
            if (typeof saveItem.hidden !== 'undefined')
            thisItem.hidden = saveItem.hidden;
        }
        for (var bonus in this.bonuses){
            if (!data.bonuses || !data.bonuses[bonus]){
                this.bonuses[bonus].level = 0;
                continue;
            }
            this.bonuses[bonus].level = data.bonuses[bonus];
        }
        for (var oneTimer in this.oneTimers){
            if (!data.oneTimers || !data.oneTimers[oneTimer]){
                this.oneTimers[oneTimer].owned = false;
                continue;
            }
            this.oneTimers[oneTimer].owned = true;
        }
        this.resetCombat(true);
    },
    getItemOrder: function(){
        var items = [];
        for (var item in this.items){
            items.push({name: item, zone: (this.items[item].zone) ? this.items[item].zone : 0})
        }
        function itemSort(a,b){
            if (a.zone > b.zone) return 1;
	        if (a.zone < b.zone) return -1;
        }
        items.sort(itemSort);
        return items;
    },
    getContracts: function(){
        var items = this.getItemOrder();
        var contracts = [];
        for (var x = 0; x < items.length; x++){
            if (!this.items[items[x].name].owned) {
                contracts.push(items[x].name)
                if (contracts.length >= 3) return contracts;
            }
        }
        return contracts;
    },
    contractPrice: function(item){
        var itemObj = this.items[item];
        var dif = itemObj.zone - 75
        return (100 * Math.pow(1.2023, dif));
    },
    items: {
        //Starting items
        Menacing_Mask: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "-" + prettify((1 - this.trimpAttackSpeed()) * 100) + "% Trimp Attack Time, +" + prettify((1 - this.enemyAttackSpeed()) * -100) + "% Enemy Attack Time.";
            },
            upgrade: "-2% Trimp Attack Time, +2% Enemy Attack Time (compounding)",
            trimpAttackSpeed: function(){
                return Math.pow(0.98, this.level);
            },
            enemyAttackSpeed: function(){ 
                return 1.05 * Math.pow(1.02, (this.level - 1));
            },
            doStuff: function(){
                autoBattle.trimp.attackSpeed *= this.trimpAttackSpeed();
                autoBattle.enemy.attackSpeed *= this.enemyAttackSpeed();
            },
            priceMod: 5
        },
        Sword: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "+" + this.effect() + " attack damage.";
            },
            upgrade: "+1 attack damage",
            effect: function(){
                return this.level;
            },
            doStuff: function(){
                autoBattle.trimp.attack += this.effect();
            },
            priceMod: 2.5
        },
        Armor: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "+" + prettify(this.effect()) + " base health.";
            },
            upgrade: "+20 base health",
            effect: function(){
                return 20 * this.level;
            },
            doStuff: function(){
                autoBattle.trimp.maxHealth += this.effect();
            },
            priceMod: 5
        },
        Rusty_Dagger: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "Can cause an enemy to bleed for 10 seconds. +" + this.formatEffect() + "% Bleed Damage. +" + prettify(this.bleedChance()) + "% Bleed Chance, doubled if the Enemy is Shocked or Poisoned.";
            },
            upgrade: "+5% Bleed Damage and +3% Bleed Chance",
            formatEffect: function(){
                return prettify(this.effect() * 100);
            },
            bleedChance: function(){
                return 17 + (3 * this.level);
            },
            effect: function(){
                return 0.1 + (0.05 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.bleedMod += this.effect();
                if (autoBattle.trimp.bleedTime < 10000) autoBattle.trimp.bleedTime = 10000;
                autoBattle.trimp.bleedChance += (autoBattle.enemy.poison.time > 0 || autoBattle.enemy.shock.time > 0) ? (this.bleedChance() * 2) : this.bleedChance();
            },
            startPrice: 25,
            priceMod: 4
        },
        Fists_of_Goo: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "Can create a poison on the enemy for 10 seconds. +" + prettify(this.effect()) + " Poison Damage. +25% Poison Chance, doubled if the enemy is bleeding."
            },
            upgrade: "+1 poison damage",
            effect: function(){
                return this.level;
            },
            doStuff: function(){
                autoBattle.trimp.poisonMod += this.effect();
                autoBattle.trimp.poisonChance += (autoBattle.enemy.bleed.time > 0) ? 50 : 25;
                if (autoBattle.trimp.poisonTime < 10000) autoBattle.trimp.poisonTime = 10000;
            },
            priceMod: 6,
            startPrice: 50
        },
        Battery_Stick: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "Can create a Shock on the enemy for 10 seconds. +" + prettify(this.shockMod() * 100) + "% Shock Damage. +35% Shock Chance, doubled if the enemy is bleeding.";
            },
            upgrade: "+10% Shock Damage",
            shockMod: function(){
                return 0.15 + (0.1 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.shockChance += (autoBattle.enemy.bleed.time > 0) ? 70 : 35;
                autoBattle.trimp.shockMod += this.shockMod();
                autoBattle.trimp.shockTime = 10000;
            },
            startPrice: 25,
            priceMod: 4
        },
        Pants: {
            owned: true,
            equipped: false,
            hidden: false,
            level: 1,
            description: function(){
                return "+" + prettify(this.effect()) + " Defense."
            },
            upgrade: "+1 Defense",
            effect: function(){
                return this.level;
            },
            doStuff: function(){
                autoBattle.trimp.defense += this.effect();
            },
        },
        //unlockables

        //raincoat, 75
        Putrid_Pouch: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 78,
            description: function(){
                return "-10% Attack Time if the enemy is Poisoned. Poisons you inflict last at least " + prettify(this.poisonTime() / 1000) + " seconds. +" + prettify(this.poisonChance()) + "% Poison Chance.";
            },
            upgrade: "+1s Poison Duration, +6% Poison Chance",
            poisonTime: function(){
                return 19000 + (this.level * 1000);
            },
            poisonChance: function(){
                return 14 + (this.level * 6);
            },
            doStuff: function(){
                if (autoBattle.enemy.poison.time > 0) autoBattle.trimp.attackSpeed *= 0.9;
                autoBattle.trimp.poisonTime = this.poisonTime();
                autoBattle.trimp.poisonChance += this.poisonChance();
            },
            startPrice: 150,
            priceMod: 4
        },
        Chemistry_Set: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 81,
            description: function(){
                var stacks = this.poisonStack();
                return "+50% Poison Chance if the enemy is not already poisoned. +" + this.defenseEffect() + " defense if the enemy is poisoned. +" + prettify(this.poisonChance()) + "% Poison Chance. Poisons you inflict can stack " + stacks + " more time" + needAnS(stacks) + ".";
            },
            upgrade: "+1 Max Poison Stack per 5 levels. +1 Defense, +4% standard Poison Chance",
            defenseEffect: function(){
                return this.level;
            },
            poisonChance: function(){
                return 6 + (this.level * 4);
            },
            poisonStack: function(){
                var levels = Math.floor(this.level / 5);
                return 1 + levels;
            },
            doStuff: function(){
                if (autoBattle.enemy.poison.time > 0) autoBattle.trimp.defense += this.defenseEffect();
                else autoBattle.trimp.poisonChance += 50;
                autoBattle.trimp.poisonChance += this.poisonChance();
                autoBattle.trimp.poisonStack += this.poisonStack();
            },
            priceMod: 4,
            startPrice: 200
        },
        //bad medkit - 84
        Comfy_Boots: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 87,
            description: function(){
                return "+" + prettify(this.defense()) + " Defense. +" + prettify(this.resistance()) + "% to all Resistances.";
            },
            upgrade: "+2 Defense, +5% Resist",
            defense: function(){
                return 2 + (this.level * 2);
            },
            resistance: function(){
                return (this.level * 5);
            },
            doStuff: function(){
                autoBattle.trimp.defense += this.defense();
                var res = this.resistance();
                autoBattle.trimp.bleedResist += res;
                autoBattle.trimp.poisonResist += res;
                autoBattle.trimp.shockResist += res;
            },
            startPrice: 430
        },
        //Labcoat 90
        Lifegiving_Gem: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 93,
            description: function(){
                return "Increases Dust gained from enemies by " + prettify(this.effect() * 100) + "% PLUS your Lifesteal amount when the enemy dies."
            },
            upgrade: "+10% Dust Gained",
            effect: function(){
                return 0.2 + (0.1 * this.level);
            },
            dustIncrease: function(){
                return this.effect() + Math.max(0, (autoBattle.trimp.lifesteal - autoBattle.enemy.lifestealResist));
            },
            startPrice: 650,
            priceMod: 4
        },
        Mood_Bracelet: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 95,
            description: function(){
                return "-" + prettify((1 - this.effect()) * 100) + "% Attack Time if the enemy is not Poisoned or Bleeding."
            },
            upgrade: "-4% Attack Time (compounding)",
            effect: function(){
                return 0.885 * Math.pow(0.96, this.level);
            },
            doStuff: function(){
                if (autoBattle.enemy.bleed.time <= 0 && autoBattle.enemy.poison.time <= 0){
                    autoBattle.trimp.attackSpeed *= this.effect();
                }
            },
            priceMod: 4,
            startPrice: 1100
        },
        Hungering_Mold: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 98,
            description: function(){
                return "Heal for " + prettify(this.healAmt()) + " per stack of Poison whenever one of your poisons deals damage. Your Poisons tick " + prettify(this.tickIncrease() * 100) + "% faster.";
            },
            upgrade: "+0.5 Heal on Poison Tick, +1% Poison Tick Speed",
            healAmt: function(){
                return 0.5 + (0.5 * this.level);
            },
            tickIncrease: function(){
                return 0.09 + (0.01 * this.level);
            },
            tickTime: function(){
                return 1000 * (1 - this.tickIncrease());
            },
            priceMod: 5,
            startPrice: 2000
        },
        Recycler: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 100,
            description: function(){
                return "+" + prettify(this.effect() * 100) + "% Lifesteal. Your Trimps' Lifesteal heals twice as much off of bleed damage.";
            },
            upgrade: "+5% Lifesteal",
            effect: function(){
                return 0.2 + (0.05 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.lifesteal += this.effect();
            },
            startPrice: 2800,
            priceMod: 5
        },
        //spiked gloves - 103
        // Corrupted_Gem: {
        //     owned: false,
        //     equipped: false,
        //     hidden: false,
        //     level: 1,
        //     zone: 96,
        //     description: function(){
        //         return "Increases Dust gained from enemies by " + prettify(this.effect() * 100) + "% PLUS your Poison Chance when the enemy dies."
        //     },
        //     upgrade: "+15% Dust Gained",
        //     effect: function(){
        //         return 0.2 + (0.15 * this.level);
        //     },
        //     dustIncrease: function(){
        //         return this.effect() + (autoBattle.trimp.poisonChance / 100);
        //     },
        //     startPrice: 5000,
        //     priceMod: 4
        // },
        Shock_and_Awl:{
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 105,
            description: function(){
                return "Can create a Shock on an enemy for 20 seconds. +" + prettify(this.attack()) + " Attack, +" + prettify(this.shockChance()) + "% Shock Chance, +" + prettify(this.shockMod() * 100) + "% Shock Damage. -25% Attack Time if the Enemy is not Shocked, +25% Lifesteal if the Enemy is Shocked.";
            },
            upgrade: "+4 Attack, +10% Shock Chance, +10% Shock Damage",
            attack: function(){
                return 6 + (4 * this.level);
            },
            shockChance: function(){
                return 20 + (10 * this.level);
            },
            shockMod: function(){
                return .40 + (.1 * this.level);
            },
            doStuff: function(){
                if (autoBattle.trimp.shockTime < 20000) autoBattle.trimp.shockTime = 20000;
                autoBattle.trimp.shockMod += this.shockMod();
                autoBattle.trimp.shockChance += this.shockChance();
                autoBattle.trimp.attack += this.attack();
                if (autoBattle.enemy.shock.time <= 0) autoBattle.trimp.attackSpeed *= 0.75;
                else autoBattle.trimp.lifesteal += 0.25;
            },
            priceMod: 5,
            startPrice: 5750
        },
        Shining_Armor: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 108,
            description: function(){
                return "+" + prettify(this.defense()) + " Defense. +" + prettify(this.health()) + " Health.";
            },
            upgrade: "+5 defense, +100 health",
            defense: function(){
                return 5 + (5 * this.level);
            },
            health: function(){
                return 100 + (this.level * 100);
            },
            doStuff: function(){
                autoBattle.trimp.defense += this.defense();
                autoBattle.trimp.maxHealth += this.health();
            },
            priceMod: 5,
            startPrice: 10000
        },
        Tame_Snimp: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 110,
            description: function(){
                return "Can create a Poison on the enemy for 10 seconds. +" + prettify(this.poisonChance()) + "% Poison Chance, +" + prettify(this.poisonMod()) + " Poison Damage. Enemy Attack is reduced by 15% while the enemy is poisoned.";
            },
            upgrade: "+10% Poison Chance, +2 Poison Damage",
            poisonChance: function(){
                return 30 + (10 * this.level);
            },
            poisonMod: function(){
                return 5 + (2 * this.level);
            },
            doStuff: function(){
                if (autoBattle.enemy.poison.time > 0) autoBattle.enemy.attack *= 0.85;
                if (autoBattle.trimp.poisonTime < 10000) autoBattle.trimp.poisonTime = 10000;
                autoBattle.trimp.poisonChance += this.poisonChance();
                autoBattle.trimp.poisonMod += this.poisonMod();
            },
            priceMod: 5.5,
            startPrice: 15000
        },

        //lich wraps - 113
        Pressure_Pointer: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 115,
            description: function(){
                return "-" + prettify((1 - this.effect()) * 100) + "% Attack Time per 5% missing enemy health.";
            },
            upgrade: "-0.4% Attack Time per 5% missing enemy health (compounding)",
            effect: function() {
                return 0.95 * Math.pow(0.996, this.level);
            },
            doStuff: function(){
                var enemyHealth = autoBattle.enemy.health / autoBattle.enemy.maxHealth;
                enemyHealth = (1 - enemyHealth) * 100;
                enemyHealth = Math.floor(enemyHealth / 5);
                var effect = Math.pow(this.effect(), enemyHealth);
                autoBattle.trimp.attackSpeed *= effect;
            },
            startPrice: 44000,
            priceMod: 4
        },
        Aegis: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 118,
            description: function(){
                return "+" + this.defenseEffect() + " Defense. If Trimp health is higher than enemy health, gain +" + prettify(this.shockChance()) + "% chance to shock, +" + prettify(this.shockMod() * 100) + "% shock damage, 15s shock time. Otherwise, this item's defense is doubled and gain +" + prettify(this.lifestealEffect() * 100) + "% Lifesteal";
            },
            upgrade: "+4 Defense, +10% Shock Chance, +10% Shock Damage, +10% Lifesteal",
            defenseEffect: function(){
                return 6 + (4 * this.level);
            },
            shockChance: function(){
                return 15 + (10 * this.level);
            },
            shockMod: function(){
                return 0.15 + (0.1 * this.level);
            },
            lifestealEffect: function(){
                return 0.05 + (0.1 * this.level);
            },
            doStuff: function(){
                if (autoBattle.trimp.health > autoBattle.enemy.health){
                    autoBattle.trimp.shockChance += this.shockChance();
                    autoBattle.trimp.shockMod += this.shockMod();
                    if (autoBattle.trimp.shockTime < 15000) autoBattle.trimp.shockTime = 15000;
                    autoBattle.trimp.defense += this.defenseEffect();
                }
                else{
                    autoBattle.trimp.lifesteal += this.lifestealEffect();
                    autoBattle.trimp.defense += (this.defenseEffect() * 2);
                }
            },
            priceMod: 8,
            startPrice: 65000,
        },
        Sword_and_Board: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 120,
            description: function(){
                return "+" + prettify(this.attack()) + " Attack. +" + prettify(this.defense()) + " Defense. +" + prettify(this.health()) + " Health.";
            },
            upgrade: "+3 Attack, +50 Health, +3 Defense",
            attack: function(){
                return 7 + (3 * this.level);
            },
            defense: function(){
                return 4 + (2 * this.level);
            },
            health: function(){
                return 200 + (50 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.attack += this.attack();
                autoBattle.trimp.defense += this.defense();
                autoBattle.trimp.maxHealth += this.health();
            },
            priceMod: 5,
            startPrice: 90000
        },
        Bloodstained_Gloves: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 123,
            description: function(){
                return "+" + prettify(this.bleedChance()) + "% to Bleed Chance, +" + prettify(this.attack()) + " Attack, -25% Enemy Attack Time, -25% Enemy Attack Damage. Fills up 25% of your Attack Speed bar whenever you cause or receive a bleed.";
            },
            upgrade: "+5% Bleed Chance, +2 Attack",
            attack: function(){
                return 6 + (this.level * 2)
            },
            onBleed: function(){
                autoBattle.trimp.lastAttack += (autoBattle.trimp.attackSpeed * 0.25);
            },
            bleedChance: function(){
                return 25 + (5 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.bleedChance += this.bleedChance();
                autoBattle.enemy.attackSpeed *= 0.75;
                autoBattle.enemy.attack *= 0.75;
                autoBattle.trimp.attack += this.attack();
            },
            startPrice: 160000
        },
        Unlucky_Coin: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 125,
            description: function(){
                return "+" + prettify(this.attack()) + " Attack. +" + prettify(this.lifesteal() * 100) + "% Lifesteal if the enemy is not Poisoned or Bleeding.";
            },
            upgrade: "+4 Attack, +10% Lifesteal",
            attack: function(){
                return 11 + (this.level * 4);
            },
            lifesteal: function(){
                return 0.2 + (this.level * .1);
            },
            doStuff: function(){
                autoBattle.trimp.attack += this.attack();
                if (autoBattle.enemy.bleed.time <= 0 && autoBattle.enemy.poison.time <= 0){
                    autoBattle.trimp.lifesteal += this.lifesteal();
                }
            },
            priceMod: 5,
            startPrice: 400000
        },
        Eelimp_in_a_Bottle: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 130,
            description: function(){
                return "+" + prettify(this.shockChance()) + "% Shock Chance, +" + prettify(this.shockMod() * 100) + "% Shock Damage. If the enemy is shocked, gain -" + prettify((1 - this.attackSpeed()) * 100) + "% Attack Speed. When shocking a non-shocked enemy, they lose all progress towards their attack.";
            },
            upgrade: "+5% Shock Chance, +5% Shock Damage, -5% Attack Time",
            attackSpeed: function(){
                return 0.9 * Math.pow(0.95, this.level);
            },
            shockChance: function(){
                return 35 + (5 * this.level);
            },
            shockMod: function(){
                return .65 + (.1 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.shockMod += this.shockMod();
                autoBattle.trimp.shockChance += this.shockChance();
                autoBattle.trimp.attackSpeed *= this.attackSpeed();
            },
            priceMod: 5,
            startPrice: 1000000
        },        
        Big_Cleaver: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 133,
            description: function(){
                return "+100% Bleed Chance if the enemy is at full Health, otherwise +25%. +" + prettify(this.attack()) + " Attack if the enemy is bleeding. Can create a Bleed on an enemy for 10s. +" + prettify(this.bleedMod() * 100) + "% Bleed Damage, +" + prettify(this.health()) + " Health.";
            },
            upgrade: "+5 Attack, +25% Bleed Damage, +100 Health",
            attack: function(){
                return 30 + (this.level * 2);
            },
            bleedMod: function(){
                return 1 + (0.25 * this.level);
            },
            health: function(){
                return 500 + (100 * this.level);
            },
            doStuff: function(){
                if (autoBattle.enemy.health == autoBattle.enemy.maxHealth) autoBattle.trimp.bleedChance += 100;
                else autoBattle.trimp.bleedChance += 25;
                autoBattle.trimp.maxHealth += this.health();
                if (autoBattle.enemy.bleed.time > 0) autoBattle.trimp.attack += this.attack();
                autoBattle.trimp.bleedMod += this.bleedMod();
                if (autoBattle.trimp.bleedTime <= 10000) autoBattle.trimp.bleedTime = 10000;
            },
            priceMod: 4,
            startPrice: 3000000
        },
        The_Globulator: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 135,
            description: function(){
                return "+" + prettify(this.defense()) + " Defense and +" + prettify(this.health()) + " Max Health if the enemy is Poisoned. On successfully adding a new Poison Stack to an Enemy, heal for half of this item's Max Health. If the Enemy is at Max Poison Stacks, non-Lifesteal healing effects on you are doubled. +" + prettify(this.poisonMod()) + " Poison Damage."
            },
            upgrade: "+5 Defense, +500 Health, +10 Poison Damage",
            defense: function(){
                return 25 + (5 * this.level);
            },
            health: function(){
                return 500 + (500 * this.level);
            },
            poisonMod: function(){
                return 15 + (10 * this.level);
            },
            onPoisonStack: function(stacks){
                if (stacks == 1) autoBattle.trimp.maxHealth += this.health();
                autoBattle.trimp.health += (this.health() / 2);
                if (autoBattle.trimp.health > autoBattle.trimp.maxHealth) autoBattle.trimp.health = autoBattle.trimp.maxHealth;
            },
            doStuff: function(){
                if (autoBattle.enemy.poison.time > 0){
                    autoBattle.trimp.maxHealth += this.health();
                    autoBattle.trimp.defense += this.defense();
                }
                autoBattle.trimp.poisonMod += this.poisonMod();
            },
            startPrice: 5e6,
            priceMod: 10
        },
        Metal_Suit: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 138,
            description: function(){
                return "+" + prettify(this.defense()) + " Defense, +" + prettify(this.health()) + " Health, +" + prettify(this.resist()) + " Bleed Resist."
            },
            upgrade: "+30 Defense, +1000 Health, +20% Bleed Resist",
            defense: function(){
                return (-10 + (this.level * 30));
            },
            health: function(){
                return (-500 + (this.level * 1000));
            },
            resist: function(){
                return (20 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.maxHealth += this.health();
                autoBattle.trimp.defense += this.defense();
                autoBattle.trimp.bleedResist += this.resist();
            },
            priceMod: 10,
            startPrice: 6e6
        },
        Nozzled_Goggles: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 140,
            description: function(){
                return "The Enemy is always Shocked, taking at least " + prettify(this.shockMod() * 100) + "% more damage. +" + prettify(this.health()) + " Health, +" + prettify(this.resist()) +  "% Poison Resist, +1 Maximum Poison Stack.";
            },
            upgrade: "+20% PermaShock Damage, +500 Health, 20% Poison Resist",
            shockMod: function(){
                return (0.2 * this.level);
            },
            health: function(){
                return (-500 + (this.level * 1000));
            },
            resist: function(){
                return (20 * this.level);
            },
            doStuff: function(){
                var enemy = autoBattle.enemy;
                if (enemy.shock.time <= 0 || enemy.shock.mod < this.shockMod()){
                    enemy.shock.time = 9999999;
                    enemy.shock.mod = this.shockMod();
                }
                autoBattle.trimp.maxHealth += this.health();
                autoBattle.trimp.poisonResist += this.resist();
                autoBattle.trimp.poisonStack++;
            },
            startPrice: 7e6,
            priceMod: 10
        },
        //Final calc items
        Bad_Medkit: {
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 84,
            description: function(){
                return "Causes bleeds you generate from other items to last at least " + this.bleedTime() + " seconds. +" + prettify(this.bleedChance()) + "% Bleed Chance. +" + prettify(this.lifesteal() * 100) + "% Lifesteal if the enemy is bleeding.";
            },
            upgrade: "+1s Minimum Bleed Time, +4% Bleed Chance, +2.5% Lifesteal",
            bleedTime: function(){
                return 11 + (1 * this.level);
            },
            lifesteal: function(){
                return 0.175 + (0.025 * this.level);
            },
            bleedChance: function(){
                return 21 + (this.level * 4);
            },
            doStuff: function(){
                if (autoBattle.trimp.bleedTime > 0 && autoBattle.trimp.bleedTime < (this.bleedTime() * 1000)) autoBattle.trimp.bleedTime = this.bleedTime() * 1000;
                if (autoBattle.enemy.bleed.time > 0) autoBattle.trimp.lifesteal += this.lifesteal();
                autoBattle.trimp.bleedChance += this.bleedChance();
            },
            startPrice: 300
        },
        Lich_Wraps: { //Final resistance item
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 113,
            description: function(){
                return "+" + prettify(this.effect()) + "% to Poison, Bleed and Shock resistance. When Poisoned, Bleeding, or Shocked, your chance to cause that status effect is increased by your total resistance to that effect.";
            },
            upgrade: "+5% resistances",
            effect: function(){
                return 10 + (5 * this.level);
            },
            doStuff: function(){
                var effect = this.effect();
                autoBattle.trimp.poisonResist += effect;
                autoBattle.trimp.bleedResist += effect;
                autoBattle.trimp.shockResist += effect;
                if (autoBattle.trimp.bleed.time > 0){
                    autoBattle.trimp.bleedChance += autoBattle.trimp.bleedResist;
                }
                if (autoBattle.trimp.shock.time > 0){
                    autoBattle.trimp.shockChance += autoBattle.trimp.shockResist;
                }
                if (autoBattle.trimp.poison.time > 0){
                    autoBattle.trimp.poisonChance += autoBattle.trimp.poisonResist;
                }
            },
            priceMod: 4,
            startPrice: 25000

        },
        Raincoat: { //After all bleed chance
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 75,
            description: function(){
                return "If you have a chance to cause Bleeding, gain +" + prettify(this.defense()) + " Defense, +" + prettify(this.health()) + " Health, +" + prettify(this.lifesteal() * 100) + "% Lifesteal, and +" + prettify(this.bleedDamage() * 100) + "% Bleed Damage.";
            },
            upgrade: "+1 defense, +10 health, +2.5% Lifesteal, +5% Bleed Damage",
            defense: function(){
                return 1 + this.level;
            },
            health: function(){
                return 20 + (10 * this.level);
            },
            lifesteal: function(){
                return 0.125 + (0.025 * this.level)
            },
            bleedDamage: function(){
                return 0.2 + (0.05 * this.level);
            },
            doStuff: function(){
                var bleedChance = autoBattle.trimp.bleedChance;
                if (autoBattle.items.Sacrificial_Shank.equipped) bleedChance = Math.floor(bleedChance * 0.75);
                if (bleedChance > autoBattle.enemy.bleedResist && autoBattle.trimp.bleedTime > 0 && autoBattle.trimp.bleedMod > 0){
                    autoBattle.trimp.defense += this.defense();
                    autoBattle.trimp.maxHealth += this.health();
                    autoBattle.trimp.lifesteal += this.lifesteal();
                    autoBattle.trimp.bleedMod += this.bleedDamage();
                }
            },
            startPrice: 100,
            priceMod: 4
        },
        Labcoat: { //after all poison chance
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 90,
            description: function(){
                return "If you have a chance to cause Poison, gain +" + prettify(this.health()) + " Health, -" + prettify((1 - this.attackTime()) * 100) + "% Attack Time, and +" + prettify(this.poisonMod()) + " Poison Damage.";
            },
            upgrade: "+25 Health, -1% Attack Time, +1 Poison Damage",
            health: function(){
                return 25 + (25 * this.level);
            },
            attackTime: function(){
                return Math.pow(0.99, this.level);
            },
            poisonMod: function(){
                return 1 + this.level;
            },
            doStuff: function(){
                var poisonChance = autoBattle.trimp.poisonChance;
                if (autoBattle.items.Sacrificial_Shank.equipped) poisonChance = Math.floor(poisonChance * 0.75);
                if (poisonChance > autoBattle.enemy.poisonResist && autoBattle.trimp.poisonMod > 0 && autoBattle.trimp.poisonTime > 0){
                    autoBattle.trimp.maxHealth += this.health();
                    autoBattle.trimp.attackSpeed *= this.attackTime();
                    autoBattle.trimp.poisonMod += this.poisonMod();
                }
            },
            startPrice: 1500,
            priceMod: 4.5
        },
        Spiked_Gloves: { //after all attack
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 103,
            description: function(){
                return "+" + this.formatEffect() + "% attack damage.";
            },
            upgrade: "+5% attack damage",
            formatEffect: function(){
                return prettify(this.effect() * 100);
            },
            effect: function(){
                return .2 + (0.05 * this.level);
            },
            doStuff: function(){
                autoBattle.trimp.attack *= (1 + this.effect());
            },
            startPrice: 4000,
            priceMod: 6,
        },
        Sacrificial_Shank: { //after all status chances
            owned: false,
            equipped: false,
            hidden: false,
            level: 1,
            zone: 145,
            enemyReduced: 0,
            description: function(){
                return "Multiply your and the Enemy's Shock, Bleed, and Poison Chances by 0.75 each. -" + prettify((1 - this.attackTime()) * 100) + "% Attack Time, +" + prettify(this.resist()) + " to all Resists, and +" + prettify(this.lifesteal() * 100) + "% Lifesteal per 10% Trimp or Enemy status chance lost.";
            },
            upgrade: "-2% Attack Time, +2.5% Resists, +1% Lifesteal per 10% status chance lost",
            attackTime: function(){
                return Math.pow(0.98, this.level);
            },
            resist: function(){
                return (2.5 * this.level);
            },
            lifesteal: function(){
                return (0.01 * this.level);
            },
            onEnemy: function(){
                var toReduce = ["poisonChance", "bleedChance", "shockChance"];
                var totalReduce = 0;
                for (var x = 0; x < toReduce.length; x++){
                    var name = toReduce[x];
                    var thisReduce = autoBattle.enemy[name] * 0.25;
                    if (thisReduce > 0){
                        autoBattle.enemy[name] -= thisReduce;
                        totalReduce += thisReduce;
                    }
                }
                this.enemyReduced = totalReduce;
            },
            doStuff: function(){
                var toReduce = ["poisonChance", "bleedChance", "shockChance"];
                var totalReduce = this.enemyReduced;
                for (var x = 0; x < toReduce.length; x++){
                    var name = toReduce[x];
                    var thisReduce = Math.ceil(autoBattle.trimp[name] * 0.25);
                    if (thisReduce > 0){
                        autoBattle.trimp[name] -= thisReduce;
                        totalReduce += thisReduce;
                    }
                }
                totalReduce = Math.floor(totalReduce / 10);
                if (totalReduce <= 0) return;
                autoBattle.trimp.attackSpeed *= Math.pow(this.attackTime(), totalReduce);
                autoBattle.trimp.lifesteal += (this.lifesteal() * totalReduce);
                autoBattle.trimp.poisonResist += (this.resist() * totalReduce);
                autoBattle.trimp.bleedResist += (this.resist() * totalReduce);
                autoBattle.trimp.shockResist += (this.resist() * totalReduce);
            },
            startPrice: 2500000,
            priceMod: 4
        }

        // Item_of_Testing: {
        //     owned: false,
        //     equipped: false,
        //     hidden: false,
        //     level: 1,
        //     description: function(){
        //         return "+3500 Trimp and Enemy Attack Speed. Doesn't count as an equipped item. Will not be implemented.";
        //     },
        //     upgrade: "Nothing",
        //     doStuff: function(){
        //         autoBattle.trimp.attackSpeed += 3500;
        //         autoBattle.enemy.attackSpeed += 3500;
        //     }
        // }

    },
    bonuses: {
        Extra_Limbs: {
            description: function(){
                return "Gain the ability to equip +1 AutoBattle item at a time."
            },
            level: 0,
            price: 100,
            priceMod: 100
        },
        Radon: {
            description: function(){
                return "Increase all Radon earned by +10% per level."
            },
            getMult: function(){
                return 1 + (this.level * 0.1);
            },
            level: 0,
            price: 50,
            priceMod: 2
        },
        Stats: {
            description: function(){
                return "Increases Attack and Health in U2 by +10% per level."
            },
            getMult: function(){
                return 1 + (this.level * 0.1);
            },
            level: 0,
            price: 100,
            priceMod: 2
        },
    },
    oneTimers: {
        Smithriffic: {
            description: "Get an extra Smithy when completing Melting Point.",
            owned: false,
            cost: 2500
        },
        Collectology: {
            description: "Collectors add 2 Hubs instead of 1.",
            owned: false,
            cost: 20000
        },
        Gathermate: {
            get description(){
                return "Gather 5% more Food, Wood, and Metal for each AutoBattle level cleared.";
            },
            owned: false,
            cost: 100000,
            getMult: function(){
                return 1 + (0.05 * (autoBattle.maxEnemyLevel - 1));
            }
        },
        Battlescruff: {
            description: "Increases all Scruffy XP gained by +5% for each AutoBattle level cleared.",
            owned: false,
            cost: 500000
        },
        Master_of_Arms: {
            description: "AutoBattle Trimps gain +200 Health, +10 Attack, and +2 Poison Damage.",
            owned: false,
            cost: 2500000
        },
        Artisan: {
            get description(){
                return "All U2 Equipment costs 0.5% less for each AutoBattle level cleared. (Currently " + prettify((1 - this.getMult()) * 100) + "% cheaper)";
            },
            owned: false,
            cost: 12500000,
            getMult: function(){
                return Math.pow(0.995, autoBattle.maxEnemyLevel - 1);
            }
        },
        Dusty_Tome: {
            description: "+5% Dust found on all levels per AutoBattle level cleared.",
            owned: false,
            cost: 10000000
        },
        Placeholder8: {
            description: "Coming soon!",
            owned: false,
            cost: 50000000
        },
        Placeholder9: {
            description: "Coming soon!",
            owned: false,
            cost: 250000000
        },
        Placeholder10: {
            description: "Coming soon!",
            owned: false,
            cost: 1250000000
        },
        Placeholder11: {
            description: "Did you really buy a placeholder?! You madman!",
            owned: false,
            cost: 6000000000
        },
        Placeholder12: {
            description: "Hey cut it out, these do nothing!",
            owned: false,
            cost: 30000000000
        },
        Placeholder13: {
            description: "Help, police!",
            owned: false,
            cost: 150000000000
        }
    },
    fight: function(){
        if (!this.trimp || !this.enemy) this.resetCombat();
        this.enemy.lastAttack += this.frameTime;
        this.trimp.lastAttack += this.frameTime;

        this.enemy.maxHealth = this.enemy.baseHealth;
        this.trimp.maxHealth = this.trimp.baseHealth;
        this.enemy.attackSpeed = this.enemy.baseAttackSpeed;
        this.trimp.attackSpeed = this.trimp.baseAttackSpeed;
        this.trimp.attack = this.trimp.baseAttack;
        this.enemy.attack = this.enemy.baseAttack;

        this.trimp.shockChance = 0;
        this.trimp.shockMod = 0;
        this.trimp.shockTime = 0;
        
        this.trimp.bleedChance = 0;
        this.trimp.bleedMod = 0;
        this.trimp.bleedTime = 0;

        this.trimp.poisonChance = 0;
        this.trimp.poisonTime = 0;
        this.trimp.poisonMod = 0;
        this.trimp.poisonStack = 2;

        this.trimp.shockResist = 0;
        this.trimp.poisonResist = 0;
        this.trimp.bleedResist = 0;

        this.trimp.defense = 0;

        this.trimp.lifesteal = 0;
        
        this.checkItems();

        var trimpAttackTime = this.trimp.attackSpeed;
        if (this.trimp.lastAttack >= trimpAttackTime){
            this.trimp.lastAttack -= trimpAttackTime;
            this.attack(this.trimp, this.enemy);
        }
        this.checkPoison(this.trimp);
        if (this.trimp.bleed.time > 0) this.trimp.bleed.time -= this.frameTime;
        if (this.trimp.shock.time > 0) this.trimp.shock.time -= this.frameTime;
        if (this.enemy.health <= 0) {
            this.enemyDied();
            return;
        }
        if (this.trimp.health <= 0){
            this.trimpDied();
            return;
        }
        var enemyAttackTime = this.enemy.attackSpeed;
        if (this.enemy.lastAttack >= enemyAttackTime){
            this.enemy.lastAttack -= enemyAttackTime;
            this.attack(this.enemy, this.trimp);
        }
        this.checkPoison(this.enemy);
        if (this.enemy.bleed.time > 0) this.enemy.bleed.time -= this.frameTime;
        if (this.enemy.shock.time > 0 && this.enemy.shock.time != 9999999) this.enemy.shock.time -= this.frameTime;
        if (this.trimp.health <= 0){
            this.trimpDied();
            return;
        }
        if (this.enemy.health <= 0) {
            this.enemyDied();
            return;
        }
    },
    checkItems: function(){
        if (this.oneTimers.Master_of_Arms.owned){
            this.trimp.maxHealth += 200;
            this.trimp.attack += 10;
            this.trimp.poisonMod += 2;
        }
        for (var item in this.items){
            var itemObj = this.items[item];
            if (!itemObj.equipped) continue;
            if (itemObj.doStuff)  itemObj.doStuff();
        }
    },
    checkPoison: function(creature){
        if (creature.poison.time > 0){
            creature.poison.lastTick += this.frameTime;
            var moldy = (!creature.isTrimp && this.items.Hungering_Mold.equipped);
            var tickTime = (moldy) ? this.items.Hungering_Mold.tickTime() : 1000;
            if (creature.poison.lastTick >= tickTime){
                var shockMod = 1;
                if (creature.shock.time > 0){
                    shockMod += creature.shock.mod;
                }
                creature.poison.lastTick = 0;
                creature.poison.time -= tickTime;
                var dmg = (creature.poison.mod * shockMod)
                creature.health -= dmg;
                if (moldy) {
                    var healFor = (this.items.Hungering_Mold.healAmt() * creature.poison.stacks);
                    if (this.items.The_Globulator.equipped) healFor *= 2;
                    this.trimp.health += healFor;
                    if (this.trimp.health > this.trimp.maxHealth) this.trimp.health = this.trimp.maxHealth;
                }
                if (creature.poison.time <= 0){
                    creature.poison.time = 0;
                    creature.poison.mod = 0;
                    creature.poison.lastTick = 0;
                    creature.poison.stacks = 0;
                }
            }
        }
    },
    rollDamage: function(attacker){
        var attack = attacker.attack * 0.2;
        var roll = Math.floor(Math.random() * 201);
        roll -= 100;
        roll /= 100;
        return (attacker.attack + (attack * roll));
    },
    attack: function(attacker, defender){
        var damage = this.rollDamage(attacker);
        var shockMod = 1;
        if (defender.shock.time > 0){
            shockMod = (1 + defender.shock.mod);
            damage *= shockMod;
        }
        damage -= defender.defense;
        if (damage < 0) damage = 0;
        defender.health -= damage;
        var atkLifesteal = attacker.lifesteal - defender.lifestealResist;
        if (atkLifesteal > 0){
            attacker.health += (damage * atkLifesteal);
            if (attacker.health > attacker.maxHealth) attacker.health = attacker.maxHealth;
        }
        if (attacker.bleed.time > 0){
            var attackerShock = 1;
            if (attacker.shock.time > 0){
                attackerShock = (1 + attacker.shock.mod);
            }
            var bdamage = defender.attack * attacker.bleed.mod * attackerShock;
            bdamage -= attacker.defense;
            var defLifesteal = defender.lifesteal - attacker.lifestealResist;
            if (defLifesteal > 0){
                var healAmt = (bdamage * defLifesteal);
                if (defender.isTrimp && this.items.Recycler.equipped) healAmt *= 2;
                defender.health += healAmt;
                if (defender.health > defender.maxHealth) defender.health = defender.maxHealth;
            }
            attacker.health -= bdamage;
            if (attacker.bleed.time <= 0){
                attacker.bleed.time = 0;
                attacker.bleed.mod = 0;
            } 
        }
        var bleedChance = attacker.bleedChance - defender.bleedResist;
        if (bleedChance > 0 && attacker.bleedMod > 0 && attacker.bleedTime > 0){
            var roll = Math.floor(Math.random() * 100);
            if (roll < bleedChance){
                if (this.items.Bloodstained_Gloves.equipped) this.items.Bloodstained_Gloves.onBleed();
                if (defender.bleed.mod < attacker.bleedMod) defender.bleed.mod = (1 + attacker.bleedMod);
                if (defender.bleed.time < attacker.bleedTime) defender.bleed.time = attacker.bleedTime;
            }
        }
        var poisonChance = attacker.poisonChance - defender.poisonResist;
        if (poisonChance > 0 && attacker.poisonMod > 0 && attacker.poisonTime > 0){
            var roll = Math.floor(Math.random() * 100);
            if (roll < poisonChance){
                if (defender.poison.time < attacker.poisonTime) defender.poison.time = attacker.poisonTime;
                defender.poison.mod += attacker.poisonMod;
                var maxPoison = attacker.poisonMod * attacker.poisonStack;
                if (defender.poison.mod > maxPoison) defender.poison.mod = maxPoison;
                if (defender.poison.stacks < attacker.poisonStack){
                    defender.poison.stacks++;
                    if (attacker.isTrimp && this.items.The_Globulator.equipped) this.items.The_Globulator.onPoisonStack(defender.poison.stacks);
                }
            }
        }
        var shockChance = attacker.shockChance - defender.shockResist;
        if (shockChance > 0 && attacker.shockMod > 0 && attacker.shockTime > 0){
            var roll = Math.floor(Math.random() * 100);
            if (roll < shockChance){
                if (defender.shock.mod < attacker.shockMod || defender.shock.time <= 0){
                    if ((defender.shock.time <= 0 || defender.shock.time == 9999999) && attacker.isTrimp && this.items.Eelimp_in_a_Bottle.equipped) defender.lastAttack = 0;
                    defender.shock.time = attacker.shockTime;
                    defender.shock.mod = attacker.shockMod;
                }
                else if (defender.shock.time < attacker.shockTime && attacker.shockMod == defender.shock.mod) defender.shock.time = attacker.shockTime;
            }
        }
    },
    resetCombat: function(resetStats){
        this.trimp = this.template();
        this.trimp.isTrimp = true;
        this.enemy = this.template();
        this.checkItems();
        this.trimp.health = this.trimp.maxHealth;
        this.enemy.level = this.enemyLevel;
        var atkSpdLevel = Math.min(this.enemyLevel, 29);
        this.enemy.baseAttackSpeed *= Math.pow(0.98, atkSpdLevel);
        if (this.enemyLevel >= 30){
            atkSpdLevel = this.enemyLevel - 29;
            this.enemy.slowAura = Math.pow(1.01, atkSpdLevel);
            this.trimp.baseAttackSpeed *= this.enemy.slowAura;
        }
        this.enemy.baseHealth *= Math.pow(1.25, (this.enemyLevel));
        this.enemy.baseAttack += (2 * (this.enemyLevel - 1));
        this.enemy.baseAttack *= Math.pow(1.03, this.enemyLevel);
        if (this.enemyLevel >= 5){
            var newLev = this.enemyLevel - 4;
            this.enemy.baseHealth *= Math.pow(1.05, newLev);
        }
        this.enemy.defense += (0.25 * this.enemyLevel);
        this.enemy.poisonResist += this.enemyLevel;
        this.enemy.bleedResist += this.enemyLevel;
        this.enemy.shockResist += this.enemyLevel;
        if (this.enemyLevel >= 15) this.enemy.lifestealResist += (0.04 * (this.enemy.level - 14))
        this.setProfile();
        this.enemy.maxHealth = this.enemy.baseHealth;
        this.enemy.health = this.enemy.baseHealth;
        if (this.items.Sacrificial_Shank.equipped) this.items.Sacrificial_Shank.onEnemy();
        this.battleTime = 0;
        if (resetStats) this.resetStats();
    },
    setProfile: function(){
        this.profile = "";
        if (this.enemyLevel == 1) return;
        var seed = this.seed;
        
        seed += (100 * this.enemyLevel);
        var effects = ["health", "attackSpeed", "attack", "defense"];
        if (this.enemyLevel > 5) {
            effects.push("poison", "bleed", "shock", "lifesteal");
        }
        if (this.enemyLevel > 10){
            effects.push("pResist", "sResist", "bResist");
        }
        var effectsCount = Math.ceil((this.enemyLevel + 1) / 5);
        var selectedEffects = [];
        var selectedEffectsCount = [];
        var maxEffectStack = 1;
        maxEffectStack += Math.floor(this.enemyLevel / 10);
        for (var x = 0; x < effectsCount; x++){
            var roll = getRandomIntSeeded(seed++, 0, effects.length);
            var effect = effects[roll];
            var checkSelected = selectedEffects.indexOf(effect);
            if (checkSelected == -1){
                selectedEffects.push(effect);
                selectedEffectsCount.push(1);
                checkSelected = selectedEffects.length - 1;
            }
            else {
                selectedEffectsCount[checkSelected]++;
            }
            if (selectedEffectsCount[checkSelected] >= maxEffectStack) {
                effects.splice(effects.indexOf(effect), 1);
            }
            switch(effect){
                case "health":
                    var mod = this.enemyLevel / 30;
                    this.profile += "+" + prettify(mod * 100) + "% health, ";
                    this.enemy.baseHealth *= (1 + mod);
                    break;
                case "attack":
                    var mod = this.enemyLevel / 30;
                    this.profile += "+" + prettify(mod * 100) + "% attack, ";
                    this.enemy.baseAttack *= (1 + mod);
                    break;
                case "attackSpeed":
                    var mod = Math.pow(0.98, this.enemyLevel);
                    this.profile += "-" + prettify((1 - mod) * 100) + "% Attack Time, ";
                    this.enemy.baseAttackSpeed *= mod;
                    break;
                case "poison":
                    this.profile += "Poisoning, ";
                    this.enemy.poisonChance += (this.enemyLevel * 3);
                    this.enemy.poisonMod += (Math.ceil(this.enemyLevel / 5));
                    this.enemy.poisonStack += Math.floor(this.enemyLevel / 10);
                    this.enemy.poisonTime = Math.ceil(this.enemyLevel / 10) * 5000;
                    break;
                case "bleed":
                    this.profile += "Bloodletting, ";
                    this.enemy.bleedChance += (this.enemyLevel * 3);
                    this.enemy.bleedMod += (this.enemyLevel / 13);
                    this.enemy.bleedTime = Math.ceil(this.enemyLevel / 10) * 10000;
                    break;
                case "shock":
                    this.profile += "Shocking, ";
                    this.enemy.shockChance += (this.enemyLevel * 3);
                    this.enemy.shockMod += (this.enemyLevel / 8);
                    this.enemy.shockTime = Math.ceil(this.enemyLevel / 10) * 10000;
                    break;
                case "pResist":
                    this.profile += "Poison Resistant, ";
                    this.enemy.poisonResist += (6 * this.enemyLevel);
                    if (selectedEffects.indexOf('bResist') != -1) effects.splice(effects.indexOf('sResist'), 1);
                    else if (selectedEffects.indexOf('sResist') != -1) effects.splice(effects.indexOf('bResist'), 1);
                    break;
                case "bResist":
                    this.profile += "Bleed Resistant, ";
                    this.enemy.bleedResist += (4 * this.enemyLevel);
                    if (selectedEffects.indexOf('pResist') != -1) effects.splice(effects.indexOf('sResist'), 1);
                    else if (selectedEffects.indexOf('sResist') != -1) effects.splice(effects.indexOf('pResist'), 1);
                    break;
                case "sResist":
                    this.profile += "Shock Resistant, ";
                    this.enemy.shockResist += (4 * this.enemyLevel);
                    if (selectedEffects.indexOf('bResist') != -1) effects.splice(effects.indexOf('pResist'), 1);
                    else if (selectedEffects.indexOf('pResist') != -1) effects.splice(effects.indexOf('bResist'), 1);
                    break;
                case "defense":
                    this.profile += "Defensive, ";
                    this.enemy.defense += (this.enemyLevel / 2);
                    break;
                case "lifesteal":
                    this.profile += "Lifestealing, ";
                    this.enemy.lifesteal += (this.enemyLevel / 50);
                    break;
            }
        }
        this.profile = this.profile.substring(0, this.profile.length - 2)
    },
    trimpDied: function(){
        this.sessionTrimpsKilled++;
        this.lootAvg.counter += this.battleTime;
        this.resetCombat();
        if (this.sessionEnemiesKilled < this.sessionTrimpsKilled) swapClass('abTab', 'abTabLosing', document.getElementById('autoBattleTab'));
        //this.notes += "Trimp Died. "
    },
    getDustMult: function(){
        var amt = 1;
        if (this.items.Lifegiving_Gem.equipped){
            amt *= (1 + this.items.Lifegiving_Gem.dustIncrease());
        }
        if (this.oneTimers.Dusty_Tome.owned){
            amt += (0.05 * (this.maxEnemyLevel - 1));
        }
        // if (this.items.Corrupted_Gem.equipped){
        //     amt *= (1 + this.items.Corrupted_Gem.dustIncrease());
        // }
        return amt;
    },
    getDustReward: function(){
        var amt = (1 + ((this.enemy.level - 1) * 5)) * Math.pow(1.25, (this.enemy.level - 1));
        amt *= this.getDustMult();
        return amt;
    },
    enemyDied: function(){
        //this.notes += "Enemy Died. "
        this.sessionEnemiesKilled++;
        var amt = this.getDustReward();
        this.dust += amt;
        this.lootAvg.accumulator += amt;
        this.lootAvg.counter += this.battleTime;
        if (this.enemy.level == this.maxEnemyLevel){
            this.enemiesKilled++;
            if (this.enemiesKilled >= this.nextLevelCount()) {
                this.maxEnemyLevel++;
                if (this.autoLevel) this.enemyLevel++;
                this.enemiesKilled = 0;
                this.resetStats();
            }
        }
        if (this.sessionEnemiesKilled > this.sessionTrimpsKilled) swapClass('abTab', 'abTabWinning', document.getElementById('autoBattleTab'));
        this.resetCombat();
    },
    nextLevelCount: function(){
        return 10 * this.enemyLevel;
    },
    update: function(){
        for (var x = 0; x < this.speed; x++){
            this.fight();
            this.popup(true, true);
            this.battleTime += this.frameTime;
        }
    },    
    getMaxItems: function(){
        return this.maxItems + this.bonuses.Extra_Limbs.level;
    },
    getDustPs: function() {
        if (this.lootAvg.accumulator == 0) return 0;
        return (1000 * (this.lootAvg.accumulator / this.lootAvg.counter));
    },
    resetStats: function(){
        this.sessionEnemiesKilled = 0;
        this.sessionTrimpsKilled = 0;
        this.lootAvg.accumulator = 0;
        this.lootAvg.counter = 0;
        this.battleTime = 0;
        swapClass('abTab', 'abTabNone', document.getElementById('autoBattleTab'));
    },
    //popup stuff
    equip: function(item){
        var count = 0;
        var itemObj = this.items[item];
        if (!itemObj.equipped && item != 'Item_of_Testing'){
            for (var ck in this.items){
                if (ck == "Item_of_Testing") continue;
                if (this.items[ck].equipped) count++;
            }
            if (count >= this.getMaxItems()) {
                this.notes = "<span class='red'>You can only equip " + this.getMaxItems() + " items at a time.</span>";
                return;
            }
        }
        if (!itemObj) return;
        itemObj.equipped = !itemObj.equipped;
        this.resetCombat(true);
        this.popup(true);
    },
    getBonusCost: function(what){
        var bonus = this.bonuses[what];
        return Math.ceil(bonus.price * Math.pow(bonus.priceMod, bonus.level));
    },
    buyBonus: function(what){
        var bonus = this.bonuses[what];
        var cost = this.getBonusCost(what);
        if (this.dust < cost) return;
        bonus.level++;
        this.dust -= cost;
        this.popup(true, false, true);
    },
    buyOneTimer: function(what){
        var bonus = this.oneTimers[what];
        if (this.dust < bonus.cost) return;
        bonus.owned = true;
        this.dust -= bonus.cost;
        this.popup(true, false, true);
    },
    hoverItem: function(item, upgrade){
        var itemObj = this.items[item];
        if (!itemObj) return;
        if (upgrade){
            this.notes = itemObj.upgrade + " per level";
        }
        else{
            this.notes = itemObj.description();
        }
        this.popup(true, true);
    },
    upgradeCost: function(item){
        var itemObj = this.items[item];
        if (!itemObj) return;
        var priceMod = 3;
        if (itemObj.priceMod) priceMod = itemObj.priceMod;
        var startPrice = 5;
        if (itemObj.startPrice) startPrice = itemObj.startPrice;
        return startPrice * Math.pow(priceMod, itemObj.level - 1);
    },
    upgrade: function(item){
        var itemObj = this.items[item];
        if (!itemObj) return;
        var cost = this.upgradeCost(item);
        if (this.dust < cost) return;
        this.dust -= cost;
        itemObj.level++;
        this.popup(true);
    },
    levelDown: function(){
        if (this.enemyLevel > 1) {
            this.enemyLevel--;
            this.autoLevel = false;
            this.resetCombat(true);
        }
        this.updatePopupBtns();
    },
    levelUp: function(){
        if (this.enemyLevel < this.maxEnemyLevel){
            this.enemyLevel++;
            this.resetCombat(true);
        }
        this.updatePopupBtns();
    },
    toggleAutoLevel: function(){
        this.autoLevel = !this.autoLevel;
        if (this.autoLevel && this.enemyLevel != this.maxEnemyLevel){
            this.enemyLevel = this.maxEnemyLevel;
            this.resetCombat(true);
        }
        this.updatePopupBtns();
    },
    updatePopupBtns: function(){
        var downBtn = document.getElementById('abDecreaseLevel');
        var upBtn = document.getElementById('abIncreaseLevel');
        var autoBtn = document.getElementById('abAutoLevel');
        if (!downBtn || !upBtn || !autoBtn) return;
        var downBtnColor = (this.enemyLevel > 1) ? "colorInfo" : "colorDisabled";
        var upBtnColor = (this.enemyLevel < this.maxEnemyLevel) ? "colorInfo" : "colorDisabled";
        var autoBtnColor = (this.autoLevel) ? "colorSuccess" : "colorDanger";
        swapClass("color", downBtnColor, downBtn);
        swapClass("color", upBtnColor, upBtn);
        swapClass("color", autoBtnColor, autoBtn);
        autoBtn.innerHTML = "AutoLevel " + ((this.autoLevel) ? "On" : "Off");
    },
    swapPopup: function(to){
        this.hideMode = false;
        this.popupMode = to;
        this.notes = "";
        this.popup(false, false, true);
    },
    toggleHideMode: function(){
        this.hideMode = !this.hideMode;
        this.popupMode = "items";
        this.popup(false, false, true)
    },
    hide: function(itemName){
        this.items[itemName].hidden = true;
        if (this.items[itemName].equipped) this.items[itemName].equipped = false;
        this.popup(false, false, true);
    },
    restore: function(itemName){
        this.items[itemName].hidden = false;
        this.popup(false, false, true);
    },
    acceptContract: function(item){
        var price = this.contractPrice(item);
        if (this.dust < price) return;
        this.dust -= price;
        this.items[item].owned = true;
        this.popup(false, false, true);
    },
    help: function(){
        var text = "<ul>";
        text += "<li>Click on an item name to equip it. You can have 4 items equipped at the start, but you can purchase 'Extra Limbs' under the Bonus button if you want some more!</li>";
        text += "<li>Contracts will eventually require you to complete the indicated level of Void Map to claim your item, after paying the Dust price. This is currently not implemented to make testing easier.</li>"
        text += "<li>Defense is a flat damage reduction. Damage taken is equal to (Enemy Attack * Shock Modifier) - Defense.</li>";
        text += "<li>Lifesteal works on Bleed damage but not Poison damage. Lifesteal is based on final damage after Shock and Defense.</li>";
        text += "<li>Shock boosts Poison and Bleed damage as well as normal attack damage.</li>";
        text += "<li>Resistance against an effect works by subtracting your current resist from the Enemy's chance to cause that effect. If the Enemy has a 50% Poison Chance and you have 25% Poison Resist, the Enemy will have an effective 25% Poison Chance.</li>";
        text += "<li>The Dust reward formula is (1 + ((EnemyLevel - 1) * 5)) * (1.25^(EnemyLevel - 1))</li>";
        text += "<li>Enemy Affixes per level are based on a seed, but everyone has the same seed and sees the same affixes each level. Feel free to discuss strategy with others!</li>";
        text += "</ul>";
        tooltip('confirm', null, 'update', text, 'autoBattle.popup()', "AutoBattle Help/FAQ", 'Back to AutoBattle', true);
        var elem = document.getElementById('tooltipDiv');
        swapClass('tooltipExtra', 'tooltipExtraLg', elem);
        elem.style.top = "25%";
        elem.style.left = "25%";

    },
    hideMode: false,
    popup: function(updateOnly, statsOnly, fromButton){
        if (!updateOnly && !statsOnly && !fromButton) {
            this.popupMode = "items";
            this.hideMode = false;
        }
        if (updateOnly && (lastTooltipTitle != "AutoBattle" || !game.global.lockTooltip)) return;
        var topText = prettify(this.dust) + " Dust (" + prettify(this.getDustPs()) + " per sec)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Enemies Killed: " + this.sessionEnemiesKilled + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Trimps Dead: " + this.sessionTrimpsKilled + "<br/>Enemy Level " + this.enemy.level + " (" + this.profile + ")&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + ((this.enemyLevel == this.maxEnemyLevel) ? "Kill " + (this.nextLevelCount() - this.enemiesKilled) : "Farming");
        var buttons = "";

        if (!(updateOnly && statsOnly)) buttons = "<div id='abLevelButtons'><span id='abDecreaseLevel' onclick='autoBattle.levelDown()' class='btn-md btn color'>- Decrease Enemy Level -</span><span onclick='autoBattle.toggleAutoLevel()' id='abAutoLevel' class='btn btn-md color'>Set AutoLevel On</span><span onclick='autoBattle.levelUp()' id='abIncreaseLevel' class='btn btn-md color'>+ Increase Enemy Level +</span><span id='abHelpBtn' onclick='autoBattle.help()' class='icomoon icon-question-circle'></span><span id='abCloseBtn' onclick='cancelTooltip()' class='icomoon icon-close'></span></div>";
        var text = "<div class='noselect'><div id='autoDust'>" + topText + "</div>" + buttons + "<div class='autoBattleTopName'>Trimp</div><div class='autoBattleTopName'>Enemy</div>";
        if (updateOnly) document.getElementById('autoDust').innerHTML = topText;
        var trimpAttackTime = (this.trimp.attackSpeed);
        var enemyAttackTime = (this.enemy.attackSpeed);

        var hpPct = Math.min(100, ((this.trimp.health / this.trimp.maxHealth) * 100)).toFixed(2);
        var EhpPct = Math.min(100, ((this.enemy.health / this.enemy.maxHealth) * 100)).toFixed(2);
        var atkPct = Math.min(100, ((this.trimp.lastAttack / (trimpAttackTime / 1000)) / 10)).toFixed(2);
        var EatkPct = Math.min(100, ((this.enemy.lastAttack / (enemyAttackTime / 1000)) / 10)).toFixed(2);
        if (updateOnly && statsOnly){
            document.getElementById('autoBattleTrimpHealthBar').style.width = hpPct + "%";
            document.getElementById('autoBattleTrimpAttackBar').style.width = atkPct + "%";
            document.getElementById('autoBattleTrimpHealth').innerHTML = prettify(this.trimp.health);
            document.getElementById('autoBattleTrimpHealthMax').innerHTML = prettify(this.trimp.maxHealth);
            document.getElementById('autoBattleEnemyHealthBar').style.width = EhpPct + "%";
            document.getElementById('autoBattleEnemyAttackBar').style.width = EatkPct + "%";
            document.getElementById('autoBattleEnemyHealth').innerHTML = prettify(this.enemy.health);
            document.getElementById('autoBattleEnemyHealthMax').innerHTML = prettify(this.enemy.maxHealth);
        }
        else{
            text += '<div class="autoBattleBarHolder"><div style="width: ' + hpPct + '%" class="progress-bar percentColorBlue" id="autoBattleTrimpHealthBar" role="progressbar"><span class="bdHover pointer noselect innerFightBar"><span id="autoBattleTrimpHealth">' + prettify(this.trimp.health) + '</span>/<span id="autoBattleTrimpHealthMax">' + prettify(this.trimp.maxHealth) + '</span></span></div></div>';
            text += '<div class="autoBattleBarHolder"><div style="width: ' + EhpPct + '%" class="progress-bar rightBar percentColorBlue" id="autoBattleEnemyHealthBar" role="progressbar"><span class="bdHover pointer noselect innerFightBar"><span id="autoBattleEnemyHealth">' + prettify(this.enemy.health) + '</span>/<span id="autoBattleEnemyHealthMax">' + prettify(this.enemy.maxHealth) + '</span></span></div></div>';
            text += '<div class="autoBattleBarHolder"><div style="width: ' + atkPct + '%" class="progress-bar percentColorYellow" id="autoBattleTrimpAttackBar" role="progressbar"><span class="innerFightBar">&nbsp;</span></div></div>';
            text += '<div class="autoBattleBarHolder"><div style="width: ' + EatkPct + '%" class="progress-bar rightBar percentColorYellow" id="autoBattleEnemyAttackBar" role="progressbar"><span class="innerFightBar">&nbsp;</span></div></div>';
        }
        var statsText = "";
        var things = ["trimp", "enemy"];
        for (var x = 0; x < things.length; x++){
            var fighterName = things[x];
            var fighterObj = this[fighterName];
            var opponentObj = (fighterObj.isTrimp) ? this.enemy : this.trimp;
            var attackTime = (fighterName == "trimp") ? trimpAttackTime : enemyAttackTime;
            attackTime /= 1000;
            var attackText = prettify(fighterObj.attack) + " (" + prettify(fighterObj.attack * 0.8) + " - " + prettify(fighterObj.attack * 1.2) + ")";
            var dustBdText = (fighterName == "trimp") ? "<b>Dust Mult: </b>" + prettify(this.getDustMult() * 100) + "%" : "<b>Dust Value:</b> " + prettify(this.getDustReward());
            statsText += "<div class='autoStats'><div class='autoStatsBreakup'><b>Attack:</b> " + attackText + "<br/><b>Attack Time:</b> " + prettify(attackTime) + "<br/><b>Defense:</b> " + prettify(fighterObj.defense) + "<br/><b>Lifesteal:</b> " + prettify(Math.max(fighterObj.lifesteal - opponentObj.lifestealResist, 0) * 100) + "%";
            if (fighterObj.slowAura > 0) statsText += "<br/><b>Slowing Aura:</b> " + prettify((fighterObj.slowAura - 1) * 100) + "%";
            else if (fighterObj.lifestealResist > 0) statsText += "<br/><b>Lifesteal Resist:</b> " + prettify(fighterObj.lifestealResist * 100) + "%";
            statsText += "</div>";
            statsText += "<div class='autoStatsBreakup'>" + dustBdText + "<br/><b>Poison Resist:</b> " + prettify(fighterObj.poisonResist) + "%<br/><b>Bleed Resist:</b> " + prettify(fighterObj.bleedResist) + "%<br/><b>Shock Resist:</b> " + prettify(fighterObj.shockResist) + "%";
            if (fighterObj.slowAura > 0 && fighterObj.lifestealResist > 0) statsText += "<br/><b>Lifesteal Resist:</b> " + prettify(fighterObj.lifestealResist * 100) + "%";
            statsText += "</div>";
            statsText += "<br/><b>Poisoned:</b> ";
            if (fighterObj.poison.time > 0){
                var timeText = (x == 1 && this.items.Hungering_Mold.equipped) ? " every " + prettify(this.items.Hungering_Mold.tickTime() / 1000) + " sec" : "every second";
                statsText += prettify(fighterObj.poison.mod) + " damage " + timeText + " for " + (fighterObj.poison.time / 1000).toFixed(1) + " sec. (" + fighterObj.poison.stacks + "/" + opponentObj.poisonStack + ")";
            }
            else statsText += "None";
            statsText += "<br/><b>Bleed:</b> ";
            if (fighterObj.bleed.time > 0){
                statsText += "Taking " + prettify(fighterObj.bleed.mod * 100) + "% attack damage after each attack for " + (fighterObj.bleed.time / 1000).toFixed(1) + " sec.";
            }
            else statsText += "None";
            statsText += "<br/><b>Shock:</b> ";
            if (fighterObj.shock.time > 0){
                var shockTime = (fighterObj.shock.time == 9999999) ? "<span class='icomoon icon-infinity'></span>" : (fighterObj.shock.time / 1000).toFixed(1);
                statsText += "Taking " + prettify(fighterObj.shock.mod * 100) + "% more damage for " + shockTime + " sec.";
            }
            else statsText += "None";
            statsText += "<br/>"
            
            if (fighterObj.poisonChance > 0){
                statsText += prettify(fighterObj.poisonChance - opponentObj.poisonResist) + "% chance to poison for " + prettify(fighterObj.poisonTime / 1000) + " sec, dealing " + prettify(fighterObj.poisonMod) + " damage per second, stacking up to " + fighterObj.poisonStack + " times.";
            }
            statsText += "<br/>";
            if (fighterObj.bleedChance > 0){
                statsText += prettify(fighterObj.bleedChance - opponentObj.bleedResist) + "% chance to bleed enemies for " + prettify(fighterObj.bleedTime / 1000) + " sec, dealing attack damage plus " + prettify(fighterObj.bleedMod * 100) + "% after each enemy attack.";
            }
            statsText += "<br/>";
            if (fighterObj.shockChance > 0){
                statsText += prettify(fighterObj.shockChance - opponentObj.shockResist) + "% chance to shock for " + prettify(fighterObj.shockTime / 1000) + " sec, causing enemies to take " + prettify(fighterObj.shockMod * 100) + "% more damage from all sources.";
            }
            statsText += "<br/>";
            statsText += "</div>"; 
    
        }
        if (updateOnly && statsOnly){
            var elem = document.getElementById('autoBattleStatsText');
            var notesElem = document.getElementById('autoBattleNotes');
            if (elem){
                if (notesElem) notesElem.innerHTML = this.notes;
                elem.innerHTML = statsText;
                return;
            }
        }
        text += "<div id='autoBattleStatsText'>" + statsText + "</div>";
        text += "<div id='autoBattleMenuButtons'><span onclick='autoBattle.swapPopup(\"items\")' class='btn btn-lg btn-primary'>Items</span><span onclick='autoBattle.swapPopup(\"bonuses\")' class='btn btn-lg colorNavy'>Bonuses</span><span onclick='autoBattle.swapPopup(\"contracts\")' class='btn btn-lg colorVoidy'>Contracts</span><span onclick='autoBattle.swapPopup(\"hidden\")' class='btn btn-lg btn-warning'>Hidden Items</span><span class='btn btn-lg btn-danger' onclick='autoBattle.toggleHideMode()'>Hide Items</span></div>";
        
        if (this.popupMode == "items" || this.popupMode == "hidden"){
            text +=  "<div id='autoBattleNotes'>" + this.notes + "</div>";
            var itemList = this.getItemOrder();
            text += "<div id='autoItemsDiv' class='niceScroll'>"
            var line1 = "";
            var line2 = "";
            var count = 1;
            var total = 0;
            for (x = 0; x < itemList.length; x++){
                var item = itemList[x].name;
                var itemObj = this.items[item];
                if (!itemObj.owned) continue;
                if (itemObj.hidden != (this.popupMode == "hidden")) continue;
                if (count > 7){
                    text += "<div>" + line1 + "</div><div>" + line2 + "</div>";
                    line1 = "";
                    line2 = "";
                    count = 1;
                }
                
                var equipClass = (itemObj.equipped) ? "Equipped" : "NotEquipped";
                var upgradeCost = prettify(this.upgradeCost(item)) + " Dust";
                line1 += "<div class='autoItem autoItem" + equipClass + "' onclick='autoBattle.equip(\"" + item + "\")' onmouseover='autoBattle.hoverItem(\"" + item + "\")'>" + item.split("_").join(' ') + " Lv " + itemObj.level + "</div>";
                if (this.popupMode == "items"){
                    if (this.hideMode)
                        line2 += "<div class='autoItem autoItemHide' onclick='autoBattle.hide(\"" + item + "\")'>Hide</div>";
                    else 
                        line2 += "<div class='autoItem autoItemUpgrade' onclick='autoBattle.upgrade(\"" + item + "\")' onmouseover='autoBattle.hoverItem(\"" + item + "\", true)'>Upgrade (" + upgradeCost + ")</div>";
                }
                else if (this.popupMode == "hidden")
                    line2 += "<div class='autoItem autoItemRestore' onclick='autoBattle.restore(\"" + item + "\")'>Restore</div>";
                count++;
                total++
            }
            if (total == 0){
                if (this.popupMode == "hidden") line1 += "<br/><b style='color: white; padding: 2%;'>You have no hidden items right now, but can hide items you're no longer using using the 'Hide Items' button above.</b>";
                else line1 += "<br/><b>All of your items are hidden!</b>";
            }

            text += "<div>" + line1 + "</div><div>" + line2 + "</div></div>";
        }
        else if (this.popupMode == "bonuses"){
            text += "<div id='autoItemsDiv' class='niceScroll'>";
            for (var bonus in this.bonuses){
                var bonusObj = this.bonuses[bonus];
                var cost = this.getBonusCost(bonus);
                var costText = (cost <= this.dust) ? "green" : "red";
                costText = "<span class='" + costText + "'>" + prettify(cost) + " Dust</span>";
                text += "<div id='" + bonus + "BonusBox' onclick='autoBattle.buyBonus(\"" + bonus + "\")' class='autoBonusBox'>" + bonus.split("_").join(' ') + "<br/>Level: " + bonusObj.level + " - " + costText + "<br/>" + bonusObj.description() + "<br/>Unlimited Purchases</div>";
            }
            var oneCount = 0;
            for (var oneTime in this.oneTimers){
                var oneObj = this.oneTimers[oneTime];
                if (oneObj.owned) continue;
                oneCount++;
                if (oneCount >= 4) break;
                var cost = oneObj.cost;
                var costText = (cost <= this.dust) ? "green" : "red";
                costText = "<span class='" + costText + "'>" + prettify(cost) + " Dust</span>";
                text += "<div onclick='autoBattle.buyOneTimer(\"" + oneTime + "\")' class='autoBonusBox autoOneTimerNotOwned'>" + oneTime.split("_").join(' ') + "<br/>" + costText + "<br/>" + oneObj.description + "</div>";
            }
            text += "<br/>";
            for (var oneTime in this.oneTimers){
                var oneObj = this.oneTimers[oneTime];
                if (!oneObj.owned) continue;
                text += "<div class='autoBonusBox autoOneTimerOwned'>" + oneTime.split("_").join(' ') + "<br/><span class='green'>Owned!</span><br/>" + oneObj.description + "</div>";
            }
            text += "</div>";
        }
        else if (this.popupMode == "contracts"){
            text += "<div id='autoItemsDiv'>";
            var contracts = this.getContracts();
            for (var x = 0; x < contracts.length; x++){
                var item = contracts[x];
                var itemObj = this.items[item];
                text += "<div class='contractBox'><div class='contractTitle'>" + item.split("_").join(' ') + "</div><div class='contractDescription'>" + itemObj.description() + "</div><span onclick='autoBattle.acceptContract(\"" + item + "\")' class='btn btn-lg colorVoidy'>Accept (" + prettify(this.contractPrice(item)) + " Dust, Complete a Z" + itemObj.zone + " Void Map)</span></div>";
            }
        }
        text += "</div>";
        var scrollTop = 0;
        var itemsElem = document.getElementById('autoItemsDiv');
        if (itemsElem){
            scrollTop = itemsElem.scrollTop;
        }
        tooltip('confirm', null, 'update', text, '', 'AutoBattle', 'Close', false, true)
        if (!(updateOnly && statsOnly)) this.updatePopupBtns();
        if (scrollTop > 0){
            itemsElem = document.getElementById('autoItemsDiv');
            if (itemsElem){
                itemsElem.scrollTop = scrollTop;
            }
        }
    }
}
