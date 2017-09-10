#!/bin/bash

rm xpath_generator.zip
zip -r xpath_generator.zip -x tags package.sh *.git* -- .
