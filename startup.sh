#!/bin/bash

pm2 start /api/api.js
pm2 start /api/crawler.js
