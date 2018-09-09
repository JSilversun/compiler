// Variables
const CODE_URL = 'http://localhost:63342/compiler/VM/code.txt';
const TEMPLATES_URL = 'http://localhost:63342/compiler/VM/templates.html';
const ISA = {
    'instruction1':instruction1,
    'instruction2':instruction2,
    'instruction3':instruction3,
};
const SUCCESS_ROW_CLASS = 'bg-success text-light';
let is_executing = false;
let PC = 0;
let $templates = null;
let instructions = [];
let toolbar = null;
// Helper classes
class Toolbar {
    constructor() {
        this.$node = null;
        this.unique_selector = '#toolbar';
        this.template_selector = '#toolbar';
        this.parent_selector = '#toolbar-container';
        this.start_or_next = { icon:'play' };
        this.stop = this.redo = { state: 'disabled' };
        createOrUpdateDomNode(this, true);
        this.setupEvents();
    }
    updateState(){
        if(is_executing){
            this.start_or_next.icon = 'arrow-right';
            this.stop.state = this.redo.state = '';
        }
        createOrUpdateDomNode(this);
        this.setupEvents();
    }
    setupEvents(){
        $('#start_or_next.btn').on('click', function () {
            if(PC+1<=instructions.length){
                is_executing = true;
                toolbar.updateState();
                instructions[PC].execute();
            }
            else{
                haltProgram();
            }
        });
        $('#stop.btn').on('click', function () {
            if(is_executing){
                is_executing = false;
                PC = 0;
                toolbar.updateState();
                haltProgram();
            }
        });
        $('#redo.btn').on('click', function () {
            if(is_executing){
                PC = 0;
                instructions[PC].execute();
            }
        })
    }
}
class Instruction{
    constructor(line, i){
        let tokens = line.split(" ");
        let instruction_name = tokens[0];
        tokens.splice(0, 1);
        this.parent_selector = '#instructions-container';
        this.template_selector ='.instruction';
        this.unique_selector = '.instruction[number='+i+']';
        this.name =  instruction_name;
        this.args = tokens;
        this.line = line;
        this.number = i;
        this.function = ISA[instruction_name];
        this.$node = null;
    }
    execute(){
        $('.instruction').removeClass(SUCCESS_ROW_CLASS);
        try{
            if(this.function.length === this.args.length){
                this.function.apply(this, this.args);
                this.$node.addClass(SUCCESS_ROW_CLASS);
                PC++;
            }
            else{
                throw new Error("Number of arguments doesn't match.")
            }
        }catch (e) {
            console.log(e.message);
        }
    }
}
// Setup
$(document).ready(function(){
    loadTemplates();
    readCode();
    toolbar = new Toolbar();
});
// Helper functions
function loadTemplates(){
    $.ajax({
        url:TEMPLATES_URL,
        async:false,
        complete:function(response) {
            let clean_template = cleanLine(response.responseText);
            $templates = $(clean_template);
        }
    });
}
function readCode(){
    $.get(CODE_URL, function(program) {
        let program_lines = splitInstructions(program);
        let i=1;
        program_lines.forEach(line => {
            let instruction = new Instruction(line, i);
            instructions.push(instruction);
            createOrUpdateDomNode(instruction, true);
            i++;
        });
     }, 'text');
}
function splitInstructions(data){
    let clean_data = cleanLine(data);
    let instructions = clean_data.split(';');
    let instructions_not_empty = instructions.filter( x => x);
    return instructions_not_empty;
}
function createOrUpdateDomNode(object, create=false){
    let template_html = $templates.find(object.template_selector)[0].outerHTML;
    let rendered_html = Mustache.render(template_html, object);
    if(create){
        $(object.parent_selector).append(rendered_html);
        object.$node = $(object.unique_selector);
    }
    else{
        $(object.unique_selector).html(rendered_html);
    }
}
function haltProgram() {
    PC = 0;
    $('.instruction').removeClass(SUCCESS_ROW_CLASS);
    $('#toolbar').remove();
    toolbar = new Toolbar();
}