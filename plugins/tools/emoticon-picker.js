// Emoticon Picker Tool Plugin
// Browse and copy emojis, kaomoji, and text emoticons

(function() {
    if (document.getElementById('emoticon-picker-styles')) return;
    const style = document.createElement('style');
    style.id = 'emoticon-picker-styles';
    style.textContent = `
.tool-content:has(.emote-widget) { display: flex; flex-direction: column; }
.emote-widget { padding: 8px; font-size: 12px; display: flex; flex-direction: column; flex: 1; width: 100%; box-sizing: border-box; min-height: 0; gap: 6px; }
.emote-search { display: flex; gap: 6px; flex-shrink: 0; }
.emote-search input { flex: 1; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px; background: var(--input-bg); color: var(--text-primary); }
.emote-search input:focus { outline: none; border-color: #3498db; }
.emote-search input::placeholder { color: var(--text-muted); }
.emote-tabs { display: flex; gap: 2px; flex-shrink: 0; overflow-x: auto; }
.emote-tab { padding: 5px 8px; border: 1px solid var(--border-color); background: var(--bg-tertiary); color: var(--text-secondary); cursor: pointer; font-size: 11px; border-radius: 4px; white-space: nowrap; }
.emote-tab:hover { background: var(--table-hover); }
.emote-tab.active { background: #3498db; color: white; border-color: #3498db; }
.emote-grid-wrap { flex: 1; overflow-y: auto; min-height: 0; }
.emote-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 2px; }
.emote-grid.kaomoji { grid-template-columns: 1fr; gap: 1px; }
.emote-cell { display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; cursor: pointer; font-size: 22px; line-height: 1; user-select: none; aspect-ratio: 1; }
.emote-cell:hover { background: var(--table-hover); }
.emote-cell.copied { background: rgba(39, 174, 96, 0.2); }
.emote-grid.kaomoji .emote-cell { font-size: 13px; aspect-ratio: auto; padding: 6px 8px; justify-content: flex-start; font-family: monospace; }
.emote-category-label { grid-column: 1 / -1; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 2px 2px; }
.emote-status { font-size: 10px; color: var(--text-muted); text-align: center; flex-shrink: 0; min-height: 16px; }
.emote-status.success { color: var(--success-text, #27ae60); }
`;
    document.head.appendChild(style);
})();

// Emoji/emoticon data
const EMOTE_DATA = {
    'Smileys': [
        ['😀','grinning'],['😃','smiley'],['😄','smile'],['😁','grin'],['😆','laughing'],['😅','sweat smile'],['🤣','rofl'],['😂','joy'],
        ['🙂','slightly smiling'],['🙃','upside down'],['😉','wink'],['😊','blush'],['😇','innocent'],['🥰','love face'],['😍','heart eyes'],
        ['🤩','star struck'],['😘','kiss'],['😗','kissing'],['😚','kissing closed'],['😙','kissing smiling'],['🥲','smile tear'],
        ['😋','yum'],['😛','tongue'],['😜','wink tongue'],['🤪','zany'],['😝','squinting tongue'],['🤑','money face'],['🤗','hugging'],
        ['🤭','hand over mouth'],['🤫','shushing'],['🤔','thinking'],['🫡','salute'],['🤐','zipper mouth'],['🤨','raised brow'],
        ['😐','neutral'],['😑','expressionless'],['😶','no mouth'],['🫥','dotted line'],['😏','smirk'],['😒','unamused'],
        ['🙄','eye roll'],['😬','grimacing'],['🤥','lying'],['😌','relieved'],['😔','pensive'],['😪','sleepy'],['🤤','drooling'],
        ['😴','sleeping'],['😷','mask'],['🤒','thermometer'],['🤕','bandage'],['🤢','nauseated'],['🤮','vomiting'],['🥵','hot'],
        ['🥶','cold'],['🥴','woozy'],['😵','dizzy'],['🤯','exploding head'],['🥳','party'],['🥸','disguised'],['😎','sunglasses cool'],
        ['🤓','nerd'],['🧐','monocle'],['😕','confused'],['🫤','diagonal mouth'],['😟','worried'],['🙁','frowning'],['😮','open mouth'],
        ['😯','hushed'],['😲','astonished'],['😳','flushed'],['🥺','pleading'],['🥹','holding back tears'],['😦','frowning open'],
        ['😧','anguished'],['😨','fearful'],['😰','anxious sweat'],['😥','sad relieved'],['😢','crying'],['😭','sobbing'],
        ['😱','screaming'],['😖','confounded'],['😣','persevering'],['😞','disappointed'],['😓','downcast sweat'],['😩','weary'],
        ['😫','tired'],['🥱','yawning'],['😤','triumph huff'],['😡','angry'],['😠','mad'],['🤬','swearing'],['👿','imp'],['💀','skull'],
        ['💩','poop'],['🤡','clown'],['👹','ogre'],['👺','goblin'],['👻','ghost'],['👽','alien'],['👾','space invader'],['🤖','robot']
    ],
    'Gestures': [
        ['👋','wave'],['🤚','raised back hand'],['🖐️','hand fingers'],['✋','raised hand'],['🖖','vulcan'],['🫱','right hand'],
        ['🫲','left hand'],['🫳','palm down'],['🫴','palm up'],['🫷','push left'],['🫸','push right'],
        ['👌','ok hand'],['🤌','pinched'],['🤏','pinching'],['✌️','peace victory'],['🤞','crossed fingers'],['🫰','love you'],
        ['🤟','love gesture'],['🤘','rock on'],['🤙','call me'],['👈','point left'],['👉','point right'],['👆','point up'],
        ['👇','point down'],['☝️','index up'],['🫵','point at you'],['👍','thumbs up'],['👎','thumbs down'],['✊','fist'],
        ['👊','punch'],['🤛','left fist'],['🤜','right fist'],['👏','clap'],['🙌','raised hands'],['🫶','heart hands'],
        ['👐','open hands'],['🤲','palms up'],['🤝','handshake'],['🙏','pray please'],['💪','flexed bicep'],['🦾','mechanical arm'],
        ['🖕','middle finger'],['✍️','writing'],['🤳','selfie'],['💅','nail polish']
    ],
    'Hearts': [
        ['❤️','red heart'],['🧡','orange heart'],['💛','yellow heart'],['💚','green heart'],['💙','blue heart'],['💜','purple heart'],
        ['🖤','black heart'],['🤍','white heart'],['🤎','brown heart'],['💔','broken heart'],['❤️‍🔥','fire heart'],['❤️‍🩹','mending heart'],
        ['❣️','exclamation heart'],['💕','two hearts'],['💞','revolving hearts'],['💓','beating heart'],['💗','growing heart'],
        ['💖','sparkling heart'],['💘','arrow heart cupid'],['💝','ribbon heart'],['💟','heart decoration'],['♥️','heart suit'],
        ['🫀','anatomical heart'],['💌','love letter'],['💋','kiss mark'],['💍','ring'],['💎','gem diamond']
    ],
    'Animals': [
        ['🐶','dog'],['🐱','cat'],['🐭','mouse'],['🐹','hamster'],['🐰','rabbit'],['🦊','fox'],['🐻','bear'],['🐼','panda'],
        ['🐻‍❄️','polar bear'],['🐨','koala'],['🐯','tiger'],['🦁','lion'],['🐮','cow'],['🐷','pig'],['🐸','frog'],['🐵','monkey'],
        ['🙈','see no evil'],['🙉','hear no evil'],['🙊','speak no evil'],['🐔','chicken'],['🐧','penguin'],['🐦','bird'],
        ['🦆','duck'],['🦅','eagle'],['🦉','owl'],['🦇','bat'],['🐺','wolf'],['🐗','boar'],['🐴','horse'],['🦄','unicorn'],
        ['🐝','bee'],['🪱','worm'],['🐛','bug'],['🦋','butterfly'],['🐌','snail'],['🐞','ladybug'],['🐜','ant'],['🪰','fly'],
        ['🐢','turtle'],['🐍','snake'],['🦎','lizard'],['🦂','scorpion'],['🦀','crab'],['🦑','squid'],['🐙','octopus'],
        ['🐠','tropical fish'],['🐟','fish'],['🐡','blowfish'],['🐬','dolphin'],['🐳','whale'],['🐋','whale2'],['🦈','shark'],
        ['🐊','crocodile'],['🐅','tiger2'],['🐆','leopard'],['🦓','zebra'],['🦍','gorilla'],['🐘','elephant'],['🦏','rhino'],
        ['🦛','hippo'],['🐪','camel'],['🐫','camel2'],['🦒','giraffe'],['🦘','kangaroo'],['🐃','water buffalo'],
        ['🦬','bison'],['🐂','ox'],['🐄','cow2'],['🐎','racehorse'],['🐖','pig2'],['🐏','ram'],['🐑','sheep'],['🦙','llama'],
        ['🐐','goat'],['🦌','deer'],['🐕','dog2'],['🐩','poodle'],['🐈','cat2'],['🐓','rooster'],['🦃','turkey'],['🦤','dodo'],
        ['🦚','peacock'],['🦜','parrot'],['🦢','swan'],['🦩','flamingo'],['🐇','rabbit2'],['🐁','mouse2'],['🐀','rat'],
        ['🐿️','chipmunk'],['🦔','hedgehog']
    ],
    'Food': [
        ['🍎','apple'],['🍐','pear'],['🍊','orange tangerine'],['🍋','lemon'],['🍌','banana'],['🍉','watermelon'],['🍇','grapes'],
        ['🍓','strawberry'],['🫐','blueberry'],['🍈','melon'],['🍒','cherry'],['🍑','peach'],['🥭','mango'],['🍍','pineapple'],
        ['🥥','coconut'],['🥝','kiwi'],['🍅','tomato'],['🥑','avocado'],['🍆','eggplant'],['🌶️','pepper'],['🫑','bell pepper'],
        ['🥒','cucumber'],['🥬','leafy green'],['🥦','broccoli'],['🧄','garlic'],['🧅','onion'],['🥔','potato'],['🍠','sweet potato'],
        ['🥐','croissant'],['🥖','baguette'],['🍞','bread'],['🥨','pretzel'],['🧀','cheese'],['🥚','egg'],['🍳','fried egg'],
        ['🥓','bacon'],['🥩','steak'],['🍗','drumstick'],['🍖','meat bone'],['🌭','hot dog'],['🍔','hamburger'],['🍟','fries'],
        ['🍕','pizza'],['🥪','sandwich'],['🌮','taco'],['🌯','burrito'],['🫔','tamale'],['🥗','salad'],['🍝','spaghetti'],
        ['🍜','ramen noodle'],['🍲','stew'],['🍛','curry'],['🍣','sushi'],['🍱','bento'],['🥟','dumpling'],['🍤','shrimp'],
        ['🍙','rice ball'],['🍚','rice'],['🍘','rice cracker'],['🍥','fish cake'],['🥮','moon cake'],['🍡','dango'],
        ['🧁','cupcake'],['🍰','cake'],['🎂','birthday cake'],['🍮','custard'],['🍭','lollipop'],['🍬','candy'],['🍫','chocolate'],
        ['🍿','popcorn'],['🍩','donut'],['🍪','cookie'],['🥛','milk'],['☕','coffee'],['🍵','tea'],['🧃','juice box'],
        ['🥤','cup straw'],['🧋','boba bubble tea'],['🍺','beer'],['🍻','beers cheers'],['🥂','champagne'],['🍷','wine'],
        ['🍸','cocktail martini'],['🍹','tropical drink'],['🧊','ice']
    ],
    'Travel': [
        ['🚗','car'],['🚕','taxi'],['🚌','bus'],['🚎','trolley'],['🚐','minibus'],['🚑','ambulance'],['🚒','fire engine'],
        ['🚓','police car'],['🏎️','race car'],['🚲','bicycle'],['🛵','scooter'],['🏍️','motorcycle'],['✈️','airplane'],
        ['🚀','rocket'],['🛸','ufo'],['🚁','helicopter'],['⛵','sailboat'],['🚢','ship'],['🚂','train'],['🚊','tram'],
        ['🏠','house'],['🏢','office'],['🏥','hospital'],['🏫','school'],['🏰','castle'],['⛪','church'],['🕌','mosque'],
        ['🗼','tokyo tower'],['🗽','statue liberty'],['🌉','bridge night'],['🏖️','beach'],['🏔️','mountain snow'],['⛰️','mountain'],
        ['🌋','volcano'],['🗻','mount fuji'],['🏕️','camping'],['🌅','sunrise'],['🌄','sunrise mountains'],['🌠','shooting star'],
        ['🎆','fireworks'],['🎇','sparkler'],['🌍','earth africa'],['🌎','earth americas'],['🌏','earth asia'],['🌙','crescent moon'],
        ['⭐','star'],['🌟','glowing star'],['✨','sparkles'],['☀️','sun'],['🌤️','partly sunny'],['⛅','partly cloudy'],
        ['🌧️','rain'],['⛈️','thunderstorm'],['❄️','snowflake'],['🌈','rainbow']
    ],
    'Objects': [
        ['⌚','watch'],['📱','phone'],['💻','laptop'],['⌨️','keyboard'],['🖥️','desktop'],['🖨️','printer'],['🖱️','mouse'],
        ['💾','floppy disk'],['💿','cd'],['📀','dvd'],['📷','camera'],['📹','video camera'],['🎥','movie camera'],['📺','tv'],
        ['📻','radio'],['🎙️','microphone'],['🎧','headphones'],['🔔','bell'],['📢','loudspeaker'],['📣','megaphone'],
        ['💡','lightbulb idea'],['🔦','flashlight'],['🕯️','candle'],['🔑','key'],['🗝️','old key'],['🔒','lock'],['🔓','unlock'],
        ['🛠️','tools hammer wrench'],['🔧','wrench'],['🔨','hammer'],['⚙️','gear'],['🧲','magnet'],['🔬','microscope'],
        ['🔭','telescope'],['📡','satellite'],['💉','syringe'],['💊','pill'],['🩹','bandaid'],['🧬','dna'],['🧪','test tube'],
        ['📦','package box'],['📫','mailbox'],['📝','memo note'],['📁','folder'],['📂','open folder'],['📌','pin'],['📎','paperclip'],
        ['✂️','scissors'],['🖊️','pen'],['✏️','pencil'],['📏','ruler'],['📐','triangle ruler'],['🗑️','trash wastebasket'],
        ['💰','money bag'],['💵','dollar'],['💴','yen'],['💶','euro'],['💷','pound'],['🪙','coin'],['💳','credit card'],
        ['🎁','gift present'],['🎈','balloon'],['🎉','party popper'],['🎊','confetti'],['🏆','trophy'],['🥇','gold medal'],
        ['🥈','silver medal'],['🥉','bronze medal'],['⚽','soccer'],['🏀','basketball'],['🏈','football'],['⚾','baseball'],
        ['🎾','tennis'],['🎮','game controller'],['🎲','dice'],['🎯','bullseye dart'],['🧩','puzzle piece'],['♟️','chess']
    ],
    'Symbols': [
        ['✅','check mark'],['❌','cross mark'],['❓','question'],['❗','exclamation'],['‼️','double exclamation'],['⁉️','exclamation question'],
        ['⚠️','warning'],['🚫','prohibited'],['⛔','no entry'],['🔴','red circle'],['🟠','orange circle'],['🟡','yellow circle'],
        ['🟢','green circle'],['🔵','blue circle'],['🟣','purple circle'],['⚫','black circle'],['⚪','white circle'],
        ['🟥','red square'],['🟧','orange square'],['🟨','yellow square'],['🟩','green square'],['🟦','blue square'],['🟪','purple square'],
        ['⬛','black square'],['⬜','white square'],['🔶','orange diamond large'],['🔷','blue diamond large'],
        ['🔸','orange diamond small'],['🔹','blue diamond small'],['🔺','red triangle up'],['🔻','red triangle down'],
        ['💠','diamond dot'],['🔘','radio button'],['🔳','white square button'],['🔲','black square button'],
        ['➕','plus'],['➖','minus'],['➗','divide'],['✖️','multiply'],['♻️','recycle'],['💯','hundred points'],
        ['🔥','fire'],['💧','water drop'],['💨','wind dash'],['🌊','wave'],['🎵','music note'],['🎶','music notes'],
        ['🔇','muted'],['🔈','low volume'],['🔉','medium volume'],['🔊','loud volume'],['📳','vibration'],
        ['⬆️','up arrow'],['⬇️','down arrow'],['⬅️','left arrow'],['➡️','right arrow'],['↗️','upper right'],['↘️','lower right'],
        ['↙️','lower left'],['↖️','upper left'],['↕️','up down'],['↔️','left right'],['🔄','counterclockwise'],['🔃','clockwise'],
        ['ℹ️','info'],['🆗','ok button'],['🆕','new button'],['🆓','free button'],['🔝','top'],['🔜','soon'],
        ['♾️','infinity'],['💲','dollar sign'],['©️','copyright'],['®️','registered'],['™️','trademark']
    ],
    'Kaomoji': [
        ['(╯°□°)╯︵ ┻━┻','table flip angry'],['┬─┬ノ( º _ ºノ)','table unflip calm'],['¯\\_(ツ)_/¯','shrug whatever'],
        ['( ͡° ͜ʖ ͡°)','lenny face'],['(☞ﾟヮﾟ)☞','finger guns'],['☜(ﾟヮﾟ☜)','finger guns left'],
        ['ʕ•ᴥ•ʔ','bear cute'],['(◕‿◕)','happy cute'],['(ᵔᴥᵔ)','puppy dog cute'],['(=^・ω・^=)','cat cute'],
        ['(⌐■_■)','sunglasses cool deal'],['(•_•) ( •_•)>⌐■-■ (⌐■_■)','putting sunglasses'],
        ['(ノಠ益ಠ)ノ彡┻━┻','rage flip'],['(╥_╥)','crying sad'],['(T_T)','tears sad'],['(;_;)','crying'],
        ['(ಥ﹏ಥ)','crying big'],['(◠‿◠)','happy smile'],['(✿◠‿◠)','flower happy'],['(*^▽^*)','excited happy'],
        ['(≧◡≦)','happy squint'],['(´・ω・`)','worried sad'],['(⊙_⊙)','surprised shocked'],['(O_O)','surprised'],
        ['(°▽°)','excited happy'],['╰(*°▽°*)╯','very happy cheering'],['(づ｡◕‿‿◕｡)づ','hug gimme'],
        ['(⊃｡•́‿•̀｡)⊃','hug reaching'],['ヽ(>∀<☆)ノ','excited yay'],['♪(´ε` )','singing whistling'],
        ['(ง •̀_•́)ง','fight strong'],['(•̀ᴗ•́)و','thumbs up got it'],['( ˘ ³˘)♥','kiss love'],['(灬ºωº灬)','blushing shy'],
        ['(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧','magic sparkle'],['(☆▽☆)','star eyes amazed'],['┌( ಠ_ಠ)┘','disapproval walking'],
        ['ಠ_ಠ','disapproval look'],['ಠ╭╮ಠ','sad disapproval'],['(ᗒᗣᗕ)՞','upset sad'],
        ['(～￣▽￣)～','dancing happy'],['♪♪ ヽ(ˇ∀ˇ )ゞ','dancing groove'],['┗(^0^)┓','running dancing'],
        ['( ˃̣̣̥ω˂̣̣̥ )','teary cute'],['(◍•ᴗ•◍)','innocent cute'],['(｡♥‿♥｡)','love struck'],
        ['✧*。٩(ˊᗜˋ*)و✧*。','celebration success'],['(∩^o^)⊃━☆ﾟ.*・','magic wand cast'],
        ['(ノ°∀°)ノ⌒・*:.。. .。.:*・゜ﾟ・*','throwing stars confetti'],
        ['凸(¬‿¬)','smug middle finger'],['( ≧Д≦)','shouting loud'],['(¬_¬)','side eye suspicious'],
        ['(눈_눈)','serious stare'],['(•ˋ _ ˊ•)','hmph annoyed'],['(︶︹︺)','frown upset'],
        ['( ´_ゝ`)','indifferent bored'],['(¬‿¬ )','sly smirk'],['(*≧▽≦)','very excited'],
        ['(˵ ͡° ͜ʖ ͡°˵)','lenny blushing']
    ]
};

PluginRegistry.registerTool({
    id: 'emoticon-picker',
    name: 'Emoticon Picker',
    description: 'Browse and copy emojis, kaomoji, and text emoticons',
    icon: '😎',
    version: '1.0.0',
    toolbox: 'productivity',
    tags: ['emoji', 'emoticon', 'kaomoji', 'smiley', 'copy', 'unicode'],
    title: 'Emoticon Picker',
    content: `<div class="emote-widget">
<div class="emote-search">
<input type="text" placeholder="Search emojis..." oninput="emoteSearch(this)">
</div>
<div class="emote-tabs"></div>
<div class="emote-grid-wrap">
<div class="emote-grid"></div>
</div>
<div class="emote-status"></div>
</div>`,
    contentType: 'html',
    onInit: 'emoteInit',
    source: 'external',
    defaultWidth: 360,
    defaultHeight: 420
});

function emoteInit() {
    document.querySelectorAll('.emote-widget').forEach(widget => {
        if (widget.dataset.inited) return;
        widget.dataset.inited = '1';
        const tabs = widget.querySelector('.emote-tabs');
        const categories = Object.keys(EMOTE_DATA);
        categories.forEach((cat, i) => {
            const btn = document.createElement('button');
            btn.className = 'emote-tab' + (i === 0 ? ' active' : '');
            btn.textContent = cat;
            btn.onclick = () => emoteSelectTab(widget, cat);
            tabs.appendChild(btn);
        });
        emoteRender(widget, categories[0]);
    });
}

function emoteSelectTab(widget, category) {
    widget.querySelectorAll('.emote-tab').forEach(t => t.classList.toggle('active', t.textContent === category));
    widget.querySelector('.emote-search input').value = '';
    emoteRender(widget, category);
}

function emoteRender(widget, category) {
    const grid = widget.querySelector('.emote-grid');
    const isKaomoji = category === 'Kaomoji';
    grid.className = 'emote-grid' + (isKaomoji ? ' kaomoji' : '');
    grid.innerHTML = '';
    const items = EMOTE_DATA[category] || [];
    items.forEach(([emote]) => {
        const cell = document.createElement('div');
        cell.className = 'emote-cell';
        cell.textContent = emote;
        cell.title = emote;
        cell.onclick = () => emoteCopy(widget, cell, emote);
        grid.appendChild(cell);
    });
    widget.querySelector('.emote-status').textContent = `${items.length} items`;
}

function emoteSearch(input) {
    const widget = input.closest('.emote-widget');
    const query = input.value.toLowerCase().trim();
    const grid = widget.querySelector('.emote-grid');

    if (!query) {
        const activeTab = widget.querySelector('.emote-tab.active');
        emoteRender(widget, activeTab ? activeTab.textContent : 'Smileys');
        return;
    }

    widget.querySelectorAll('.emote-tab').forEach(t => t.classList.remove('active'));
    grid.className = 'emote-grid';
    grid.innerHTML = '';
    let count = 0;
    let hasKaomoji = false;

    for (const [category, items] of Object.entries(EMOTE_DATA)) {
        const matches = items.filter(([, tags]) => tags.toLowerCase().includes(query));
        if (matches.length === 0) continue;

        if (category === 'Kaomoji') { hasKaomoji = true; continue; } // render kaomoji after

        const label = document.createElement('div');
        label.className = 'emote-category-label';
        label.textContent = category;
        grid.appendChild(label);

        matches.forEach(([emote]) => {
            const cell = document.createElement('div');
            cell.className = 'emote-cell';
            cell.textContent = emote;
            cell.title = emote;
            cell.onclick = () => emoteCopy(widget, cell, emote);
            grid.appendChild(cell);
            count++;
        });
    }

    // Render kaomoji matches at the end with proper styling
    if (hasKaomoji) {
        const kMatches = EMOTE_DATA['Kaomoji'].filter(([, tags]) => tags.toLowerCase().includes(query));
        if (kMatches.length > 0) {
            const label = document.createElement('div');
            label.className = 'emote-category-label';
            label.textContent = 'Kaomoji';
            grid.appendChild(label);
            kMatches.forEach(([emote]) => {
                const cell = document.createElement('div');
                cell.className = 'emote-cell';
                cell.style.fontSize = '13px';
                cell.style.aspectRatio = 'auto';
                cell.style.justifyContent = 'flex-start';
                cell.style.fontFamily = 'monospace';
                cell.style.padding = '6px 8px';
                cell.textContent = emote;
                cell.title = emote;
                cell.onclick = () => emoteCopy(widget, cell, emote);
                grid.appendChild(cell);
                count++;
            });
        }
    }

    widget.querySelector('.emote-status').textContent = count > 0 ? `${count} results` : 'No results';
}

function emoteCopy(widget, cell, text) {
    navigator.clipboard.writeText(text).then(() => {
        cell.classList.add('copied');
        setTimeout(() => cell.classList.remove('copied'), 300);
        const status = widget.querySelector('.emote-status');
        status.textContent = `Copied: ${text}`;
        status.className = 'emote-status success';
        setTimeout(() => { status.className = 'emote-status'; }, 1500);
    });
}

console.log('Emoticon Picker plugin loaded');
