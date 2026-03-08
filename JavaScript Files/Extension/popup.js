//Color Objects
const frameColor = document.getElementById("frameColor");
const innactiveFrameColor = document.getElementById("frameColorInactive");
const toolbarColor = document.getElementById("toolbarColor");
const tabTextColor = document.getElementById("tabTextColor");
const innactiveTabTextColor = document.getElementById("tabTextColorInactive");
const bookmarkTextColor = document.getElementById("bookmarkTextColor");
const newTabTextColor = document.getElementById("newTabTextColor");
const arrayOfColors = [frameColor, 
                        innactiveFrameColor, 
                        toolbarColor, 
                        tabTextColor, 
                        innactiveTabTextColor, 
                        bookmarkTextColor, 
                        newTabTextColor];

const tabButtons = document.querySelectorAll(".tab h3");
const tabContents = document.querySelectorAll(".tab-content > div");

//Tab functionality
tabButtons.forEach((tab, index) => {
    tab.addEventListener("click", () => {
        tabContents.forEach(content => {
            content.classList.remove("active");
        });
        tabButtons.forEach (btn => {
            btn.classList.remove("active");
        });
        tabContents[index].classList.add("active");
        tabButtons[index].classList.add("active");
    });
});


function convertColorToRGB(element){
    const color = element.value;
    const r = parseInt(color.slice(1,3), 16);
    const g = parseInt(color.slice(3,5), 16);
    const b = parseInt(color.slice(5,7), 16);
    const rgb = [r, g, b];
    return rgb;
}

function stringToRGB(array){
    const r = array[0];
    const g = array[1];
    const b = array[2];
    return "[" + r + ", " + g + ", " + b + "]";
}

function displayColors(){
    for(let i = 0; i < arrayOfColors.length; i++){
        temp = convertColorToRGB(arrayOfColors[i]);
        console.log(stringToRGB(temp)); 
            
    }
}

//Create the theme with the button and download the manifest.json file
const applyButton = document.getElementById("applyButton").addEventListener("click", function(){

const themeData = {
    "name" : "Custom Theme",
    "version" : "1.0",
    "manifest_version" : 3,
    "description" : "A custom theme created by the user.",

    "theme" : {
        "colors" : {
            "frame" : convertColorToRGB(frameColor),
            "toolbar" : convertColorToRGB(toolbarColor),
            "tab_text" : convertColorToRGB(tabTextColor),
            "bookmark_text" : convertColorToRGB(bookmarkTextColor),
            "ntp_text" : convertColorToRGB(newTabTextColor),
            "tab_background_text" : convertColorToRGB(innactiveTabTextColor),
            "frame_inactive" : convertColorToRGB(innactiveFrameColor)
        },
    
    "tints" : {
        "buttons" : [0.33, 0.5, 0.74]
    }
    }  
}

const blob = new Blob([JSON.stringify(themeData)], {type: "application/json"});
const url = URL.createObjectURL(blob);

chrome.downloads.download({
    url: url,
    filename: "manifest.json",
    saveAs: true
});

});

displayColors();