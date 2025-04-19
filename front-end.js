waitlist = [];

showlist();

function showlist(){
    let html = ``;
    for (let index = 0; index < waitlist.length; index++) {
        const block = waitlist[index];
        const todo = block.item;
        const duetime = block.dueday;
        const show = `
        <p class="css-item">${todo} ${duetime}
        <button class="css-delete"
        onclick="
        deleteitem(${index})
        "
        >Delete</button>
        </p>
        `
        html += show;
    }
    document.querySelector('.js-show').innerHTML = html;
}

function adding(){
    const event = document.querySelector('.js-input');
    const eventvalue = event.value;

    const due = document.querySelector('.js-date')
    const duevalue = due.value;

    waitlist.push({
        item: eventvalue,
        dueday: duevalue
    });
    console.log(waitlist);
    showlist();
}

function deleteitem(index){
    waitlist.splice(index,1);
    showlist();
}