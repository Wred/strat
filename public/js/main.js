"use strict";

var socket = io();

class Main {
	constructor (dom) {
		this.dom = dom;
		this.dom.innerText = "Works";
	}
}

window.addEventListener('load', function (e) {
	var main = new Main(document.getElementById('game'));
});
