// Color picker component

const COLORS = [
  {hex: '#000000', name: 'Black'},
  {hex: '#EF4437', name: 'Red'},
  {hex: '#E71F63', name: 'Pink'},
  {hex: '#8F3E97', name: 'Purple'},
  {hex: '#65499D', name: 'Deep Purple'},
  {hex: '#4554A4', name: 'Indigo'},
  {hex: '#2083C5', name: 'Blue'},
  {hex: '#35A4DC', name: 'Light Blue'},
  {hex: '#09BCD3', name: 'Cyan'},
  {hex: '#009688', name: 'Teal'},
  {hex: '#43A047', name: 'Green'},
  {hex: '#8BC34A', name: 'Light Green'},
  {hex: '#FDC010', name: 'Yellow'},
  {hex: '#F8971C', name: 'Orange'},
  {hex: '#F0592B', name: 'Deep Orange'},
  
];

export default function initColorPicker(el, value, onChange) {
  function setColor(value, fireOnChange = true) {
    
    currentValue = value;
    a.setAttribute('data-color', value);
    a.style.background = value;
    if (fireOnChange && typeof onChange === 'function') {
      onChange(value);
    }
    closePicker();
  }

  function togglePicker() {
    if (isPickerOpen) {
      closePicker();
    } else {
      openPicker();
    }
  }

  function closePicker() {
    document.removeEventListener('keyup', handleDocumentKeyup);
    if (picker && picker.parentNode) {
      picker.parentNode.removeChild(picker);
    }
    isPickerOpen = false;
    a.focus();
  }
  function enablecustomcolor()
   {
    var x = document.querySelector(".custominput");
    if (x.style.display === "none" || x.style.display === "") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
   }

  function openPicker() {
    if (!picker) {
      picker = document.createElement('div');
      var picker1 = document.createElement('div');
      picker.className = 'color-picker'
      picker.style.background = '#fff';
      picker.style.border = '1px solid #ccc';
      picker.style.padding = '2px';
      picker.style.position = 'absolute';
      picker.style.width = '122px';
      el.style.position = 'relative';
      var starandcolor=`<div class="stndardcolor">
      <span>Standard Color</span>
      <a class="color" href="javascript://" title="Black" data-color="#000000" style="background: rgb(0, 0, 0); margin: 2px 10px;"></a>
      </div>
      `
      picker1.innerHTML=starandcolor;
       picker1=picker1.firstChild;
      picker.appendChild(picker1);
      var picker2 = document.createElement('div');
      var addcustomtcolor=`<div class="add-custompic"><span class="plus-icon">+</span><a href="javascript://" class="addcustombutton"> Addcustom Color</a>
      <div class="custominput">
      <input type="text" class="color-codei">
      <button class="custoncoloradd">+</button>
      </div>
      </div>
      ` 
      picker2.innerHTML=addcustomtcolor;
      picker2=picker2.firstChild
      


      
      

      COLORS.map(createColorOption).forEach((c) => {
        c.style.margin = '2px';
        c.onclick = function () { setColor(c.getAttribute('data-color')); };
        picker.appendChild(c);
      });
     
      picker.appendChild(picker2);
      
     
       }
       
    document.addEventListener('keyup', handleDocumentKeyup);
    el.appendChild(picker);
    document.querySelector(".addcustombutton").onclick = function () { enablecustomcolor(); };

    document.querySelector(".custoncoloradd").onclick=function(){setcolorcode();}
    isPickerOpen = true;
  }
  function setcolorcode(){
    
    var colorcode= document.querySelector(".color-codei").value;
    setColor(colorcode)

  }
   
  function createColorOption(color) {
    let e = document.createElement('a');
    e.className = 'color';
    e.setAttribute('href', 'javascript://');
    e.setAttribute('title', color.name);
    e.setAttribute('data-color', color.hex);
    e.style.background = color.hex;
    return e;
  }
  
  function handleDocumentKeyup(e) {
    if (e.keyCode === 27) {
      closePicker();
    }
  }

  let picker;
  let isPickerOpen = false;
  let currentValue;
  let a = createColorOption({hex: value});
  a.onclick = togglePicker;
  el.appendChild(a);
  setColor(value, false);
}

