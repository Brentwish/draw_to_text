//  GRAMMAR Algebra
//
//      expr   : term ((PLUS | MINUS) term)*
//      term   : factor ((MUL | DIV) factor)*
//      factor : INTEGER | LPAREN expr RPAREN


///
//String helper methods
///

String.prototype.is_space = function () {
  return this[0] == " ";
}

String.prototype.is_digit = function() {
  return !isNaN(parseFloat(this)) && isFinite(this);
}


///////////////////////////////////////////////////////////////////////////
//                                                                       //
// LEXER                                                                 //
//                                                                       //
///////////////////////////////////////////////////////////////////////////

// Token Types
var INTEGER = "INTEGER";
var PLUS = "PLUS";
var MINUS = "MINUS";
var MUL = "MUL";
var DIV = "DIV";
var LPAREN = "(";
var RPAREN = ")";
var EOF = "EOF";


//Token Class
function Token(type, value) {
  this.type = type;
  this.value = value;
}

Token.prototype.__str__ = function() {
  return "Token(" + String(this.type) + ", " + String(this.value) + ")";
}

Token.prototype.__repr__ = function() {
  return this.__str__()
}

function Lexer(text) {
  this.text = text;
  this.pos = 0;
  this.current_token = null;
  this.current_char = this.text[this.pos];
}

Lexer.prototype.error = function() {
  throw ("Invalid Character");
}

Lexer.prototype.advance = function() {
  this.pos += 1;
  if (this.pos > this.text.length - 1) {
    this.current_char = null;
  } else {
    this.current_char = this.text[this.pos];
  }
}

Lexer.prototype.skip_whitespace = function() {
  while (this.current_char != null && this.current_char.is_space()) {
    this.advance();
  }
}

Lexer.prototype.integer = function() {
  var result = "";
  while (this.current_char != null && this.current_char.is_digit()) {
    result += this.current_char;
    this.advance()
  }
  return parseInt(result)
}

//This is the "lex": converts chars to new Tokens.
Lexer.prototype.get_next_token = function() {
  while (this.current_char != null) {
    if (this.current_char.is_space()) {
      this.skip_whitespace();
    }
    if (this.current_char.is_digit()) {
      return new Token(INTEGER, this.integer());
    }
    if (this.current_char == "+") {
      this.advance();
      return new Token(PLUS, "+");
    }
    if (this.current_char == "-") {
      this.advance();
      return new Token(MINUS, "-");
    }
    if (this.current_char == "*") {
      this.advance();
      return new Token(MUL, "*");
    }
    if (this.current_char == "/") {
      this.advance();
      return new Token(DIV, "/");
    }
    if (this.current_char == "(") {
      this.advance();
      return new Token(LPAREN, "(");
    }
    if (this.current_char == ")") {
      this.advance();
      return new Token(RPAREN, ")");
    }
    //If we got here, the character we're evaluating is invalid
    this.error();
  }
  return new Token(EOF, null);
}


///////////////////////////////////////////////////////////////////////////
//                                                                       //
// PARSER                                                                //
//                                                                       //
///////////////////////////////////////////////////////////////////////////

function AST() {
}

function BinOp(left, op, right) {
  AST.call();
  this.left = left;
  this.token = op;
  this.op = op;
  this.right = right
}

function Num(token) {
  AST.call();
  this.token = token;
  this.value = token.value;
}

function Parser(lexer) {
  this.lexer = lexer;
  this.current_token = this.lexer.get_next_token();
}

Parser.prototype.error = function() {
  throw ("Invalid Syntax");
}

Parser.prototype.eat = function(token_type) {
  if (this.current_token.type == token_type) {
    this.current_token = this.lexer.get_next_token();
  } else {
    this.error();
  }
}

Parser.prototype.factor = function() {
//factor : INTEGER | LPAREN expr RPAREN

  var token = this.current_token;
  if (token.type == INTEGER) {
    this.eat(INTEGER);
    return new Num(token);
  } else if (token.type == LPAREN) {
    this.eat(LPAREN);
    var node = this.expr();
    this.eat(RPAREN);
    return node;
  }
}

Parser.prototype.term = function() {
//term   : factor ((MUL | DIV) factor)*
  var node = this.factor();
  while (this.current_token.type == MUL || this.current_token.type == DIV) {
    var token = this.current_token;
    if (token.type == MUL) {
      this.eat(MUL);
    } else if (token.type == DIV) {
      this.eat(DIV);
    }
    node = new BinOp(node, token, this.factor());
  }
  return node;
}

Parser.prototype.expr = function() {
//expr   : term ((PLUS | MINUS) term)*

  var node = this.term();
  while (this.current_token.type == PLUS || this.current_token.type == MINUS) {
    var token = this.current_token;
    if (token.type == PLUS) {
      this.eat(PLUS);
    } else if (token.type == MINUS) {
      this.eat(MINUS);
    }
    node = new BinOp(node, token, this.term());
  }
  return node;
}

Parser.prototype.parse = function() {
  return this.expr();
}


///////////////////////////////////////////////////////////////////////////
//                                                                       //
// INTERPRETER                                                           //
//                                                                       //
///////////////////////////////////////////////////////////////////////////

function Interpreter(parser) {
  this.parser = parser;
}

Interpreter.prototype.visit = function(node) {
  var method_name = 'visit_' + node.constructor.name;
  var visitor = this[method_name].bind(this);
  return visitor(node);
}

Interpreter.prototype.visit_BinOp = function(node) {
  if (node.op.type == PLUS) {
    return this.visit(node.left) + this.visit(node.right);
  } else if (node.op.type == MINUS) {
    return this.visit(node.left) - this.visit(node.right);
  } else if (node.op.type == MUL) {
    return this.visit(node.left) * this.visit(node.right);
  } else if (node.op.type == DIV) {
    return this.visit(node.left) / this.visit(node.right);
  }
}

Interpreter.prototype.visit_Num = function(node) {
  return node.value;
}

Interpreter.prototype.interpret = function() {
  tree = this.parser.parse();
  return this.visit(tree);
}



var text = "((9-4)*(3*5+5))";
var lexer = new Lexer(text);
var parser = new Parser(lexer);
var interpreter = new Interpreter(parser);
//var result = interpreter.interpret();
var result = parser.parse();
console.log(result);
