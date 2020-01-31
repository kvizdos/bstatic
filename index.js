#!/usr/bin/env node
const express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 9091;

const program   = require('commander');
const chalk     = require('chalk');
const fs        = require('fs');
const nodeWatch = require('node-watch');

const cheerio = require('cheerio');

io.on('connection', (socket) => {});

program.arguments('<directory>')
       .usage('<directory>')
       .option('-r, --noreload', 'This is enabled by default, disables live reloads')
       .option('-p, --port <port>', 'Specify a different port other than 9091')
       .action((directory) => {
              app.use('/assets', express.static(`${directory}/assets`))
              app.get('/', (req, res) => {
                     var html = fs.readFileSync(`${directory}/index.html`, 'utf8');
                     var $ = cheerio.load(html);
                     var scriptNode = `
                     <script src="/socket.io/socket.io.js"></script>
                     <script>
                            var socket = io();
                            socket.on('hotload', () => { 
                                   console.log("Hot reloading")
                                   window.location = window.location; 
                            })
                     </script>
                     `;
                     
                     if(!program.noreload) $('body').append(scriptNode);
                     res.send($.html());

                     nodeWatch(directory, {recursive: true}, (event, filename) => {
                         io.emit('hotload');
                     })
              });
       
              http.listen(program.port || port, () => {
                     console.log(chalk.bold.whiteBright("BStatic launched with the params:"))
                     console.log(chalk.white.bold("Directory:"), chalk.bgHex("036d82").whiteBright(directory))
                     console.log(chalk.white.bold("Port:"), chalk.bgHex("036d82").whiteBright(program.port || port))
                     console.log(chalk.white.bold("Live Reload:"), chalk.bgHex("036d82").whiteBright(!program.noreload))
              });
       }).parse(process.argv);



