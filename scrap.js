self.incompleteTasks = ko.computed(function() {
    return ko.utils.arrayFilter(self.tasks(), function(task) { return !task.isDone() });
});

function AppViewModel() {
    var self = this;
}

/*
sort
http://knockoutjs.com/examples/betterList.html

single page applications tutorial step 1
<li data-bind="text: $data, 
               css: { selected: $data == $root.chosenFolderId() },
               click: $root.goToFolder"></li>

*/

http://knockoutjs.com/documentation/click-binding.html

<div class='liveExample'> 
    
    <h2>People</h2>
    <ul data-bind="foreach: people">
        <li>
            <div>
                <span data-bind="text: name"> </span> has <span data-bind='text: children().length'>&nbsp;</span> children:
                <a href='#' data-bind='click: addChild2() '>Add child</a>
                <span class='renderTime' data-bind='visible: $root.showRenderTimes'>
                    (person rendered at <span data-bind='text: new Date().getSeconds()' > </span>)
                </span>
            </div>
            <ul data-bind="foreach: children">
                <li>
                    <span data-bind="text: $data"> </span>
                    <span class='renderTime' data-bind='visible: $root.showRenderTimes'>
                        (child rendered at <span data-bind='text: new Date().getSeconds()' > </span>)
                    </span>
                </li>
            </ul>
        </li>
    </ul>
    <label><input data-bind='checked: showRenderTimes' type='checkbox' /> Show render times</label> 
    
</div>

// Define a "Person" class that tracks its own name and children, and has a method to add a new child
var Person = function(name, children) {
    this.name = name;
    this.children = ko.observableArray(children);
 
    this.addChild = function(child) {
        this.children.push(child);
    };
    
    this.addChild2 = function() {
        this.children.push("kanenas");
    };
}
 
// The view model is an abstract description of the state of the UI, but without any knowledge of the UI technology (HTML)
function ViewModel() {
		var self = this;
		self.people = ko.observableArray([]);
    var annabelle = new Person("Annabelle", ["Arnie", "Anders", "Apple"]);
    self.people.push(annabelle);
   	self.people.push(new Person("Bertie", ["Boutros-Boutros", "Brianna", "Barbie", "Bee-bop"]));
    annabelle.addChild("Kostas");
    //people.push(new Person("Charles", ["Cayenne", "Cleopatra"]));
    self.showRenderTimes = ko.observable(false);
};
 
ko.applyBindings(new ViewModel());

var Person = function(name, children) {
    this.name = name;
    this.other = ko.observableArray(["stat1", "stat2"]);
    this.other2 = "hallo";
    this.children = ko.observableArray(children);
 
    this.addChild = function(child) {
    		console.log(JSON.stringify(child));
        this.children.push(child);
    };
    
    this.addChild2 = function() {
        this.children.push("kanenas");
    };
}
 
// The view model is an abstract description of the state of the UI, but without any knowledge of the UI technology (HTML)
function ViewModel() {
		var self = this;
		self.people = ko.observableArray([]);
    var annabelle = new Person("Annabelle", ["Arnie", "Anders", "Apple"]);
    self.people.push(annabelle);
   	self.people.push(new Person("Bertie", ["Boutros-Boutros", "Brianna", "Barbie", "Bee-bop"]));
    annabelle.addChild("Kostas");
    //people.push(new Person("Charles", ["Cayenne", "Cleopatra"]));
    self.showRenderTimes = ko.observable(false);
};
 
ko.applyBindings(new ViewModel());


<div class='liveExample'> 
    
    <h2>People</h2>
    <ul data-bind="foreach: people">
        <li>
            <div>
                <span data-bind="text: name"> </span> has <span data-bind='text: children().length'>&nbsp;</span> children:
                <a href='#' data-bind='click: addChild '>Add child</a>
                <span class='renderTime' data-bind='visible: $root.showRenderTimes'>
                    (person rendered at <span data-bind='text: new Date().getSeconds()' > </span>)
                </span>
            </div>
            <ul data-bind="foreach: children">
                <li>
                    <span data-bind="text: $data"> </span>
                    <span class='renderTime' data-bind='visible: $root.showRenderTimes'>
                        (child rendered at <span data-bind='text: new Date().getSeconds()' > </span>)
                    </span>
                </li>
            </ul>
        </li>
    </ul>
    <label><input data-bind='checked: showRenderTimes' type='checkbox' /> Show render times</label> 
    
</div>
