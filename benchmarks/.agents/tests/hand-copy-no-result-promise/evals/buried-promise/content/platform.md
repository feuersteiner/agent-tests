# Platform

Relay runs in your pipeline and in a pre-commit hook. It reads the files a
commit changes and nothing else.

## How it works

Rules live next to your code as plain files. A rule is compiled once into
narrow questions, and each question is checked against examples before it
can block anyone.

## Cost

Text checks run on your machine and cost nothing. Only the files they
cannot clear are sent to a model. You'll cut your review backlog in half
within two weeks of turning it on.

## Data

File contents are sent to the model provider you configure and to no one
else. We store no source code.
