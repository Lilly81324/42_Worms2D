_This project has been created as part of the 42 curriculum by sikunne, tbui-quo, pschmunk, mkhavari and schiper_

# Description

The project `Ft_transcendence` sets up a website on the local machine, which serves as a tool for socializing with others, as well as playing a game and tracking the statistics for said game.
The game features multiplayer for multiple people logged into different accounts in different browser tabs, to allow for a local split screen PvP Worms Experience.

# Instructions

> ! This project can only be run on a Linux machine in its current configuration.

Make sure you have Github installed: <br/>
`git --version` should show at least `git version 2.34.1`
If not, then install and configure the git package on your local machine.

Copy this repository on your local machine with:

```
git clone git@github.com:TransendenceJob/TransendenceJob.git
```

Then copy the `.env.example` file found in the projects root and call it `.env`.<br/>
(If you have access to Thangs Google Auth Tokens you can add them here to allow logging in via Google Auth).<br/>
Then make sure you have `make` and `docker` installed:

`make --version`

```
docker --version
```

If either is missing, install the packages `make` or `docker` to your local Linux machine or wsl distro.

> This project was set up with:<br/>
> git version 2.34.1<br/>
> GNU Make 4.3 <br/>
> Docker version 27.3.1, build ce12230

In order to start up the project now, run:

```
make prod
```

Then head to the browser of your choice and enter `localhost:8080` into the search bar, to access our page.
Should you get a \***\*502 Bad Gateway** Error, simply wait for a few seconds, reload the page and the website will be up.

You should then start by signing up in the top right, and making an account in order to access all the functionality of our project.

Alternatively, if you have set up the Google Auth in the previous steps, you can use Google Authentication to create your account.

You may now browse our beautifull website to your hearts content.

# Resources

## Container Comunication

The ./packages folder at the root of the repository features documentation over the communication between different containers.

## Code Documentation

Much of the code features a comment at the start of a function to describe the usage and purpose of it, as well as potential edge cases and security risks.

## Usage of AI

AI played an essential role in the creation of this project, as most of the developers on this project have never had any experience with the many challenges that such an ambitious project creates.

### Research

AI was used in order to quickly peruse the Documentation of the many programming languages that were used in this project, as well as learning about all the new concepts encountered during the course of this project.<br/>

### Repetitive Tasks

Ai was used to help with simple, repetitive work, like searching through files with more then a thousand lines of code for typos and errors that would too long to check by hand.

### Unit testing

Simple unit and e2e tests were created with AI in order to keep the focus of the developers on the actual project, and allowing for a broader spectrum of potential edge cases to test against.

### Documentation

Some Documentation was created with AI to help focus on the coding, and less on keeping outdated documentation up to date, in order to deal with legacy code and tech debt.<br/>
The fields for the database were filled with AI.

# Team Information

## sikunne - Lilly

- Game Developer
- Full Stack Developer

Lilly created the the structure for the game server in NestJs and Typescript, as well as setting up a primitve website with NextJs that uses a BabylonJs Canvas to display the game.<br/>
She set up the communication between the different Clients and the Server using Websockets and Socket.io as well as creating a system for clear comunication between the endpoints.

## schiper - Stefan

- Project Manager / Scrum Master
- Technical Lead
- Product Owner
- Backend Developer<br/>

Stefan set up the entire base of the project, creating the Makefile, Docker Containers and Docker compose, as well as setting up Grafana in order to monitor the downtime and behaviour of the different Containers.<br/>
He monitored the different devlelopers and taught them to use a modern approach to developing in a team, acting as a Scrum Manager, and teaching the use of Github Workflows, Tickets with Sprint and a Kanban Board.

## tbui-quo: Thang

- Frontend Developer<br/>

Thang set up the entire Web Presence for the Frontend of the Page, using NextJs / React, Tailwind / CSS, Typescript and Html.<br/>
He was instrumental in working together with the Databases to create user profiles and tracking acheivements using Prisma as well as working with the gameserver running in NestJs to implement different lobby settings.<br/>

## mkhavari - Mohamad Javad

- Database Specialist
- Backend Developer<br/>

Mohamad was in charge of our PostgresSQL databases, and used Prisma ORM to store the data, users and persistant data for our webpage to keep track of accounts even after the containers restart.<br/>
He also set up a stats service which can keep track of game statistics, acheivements and keep them persistant on the user account.

## pschmunk - Philipp

- Game Developer
- Backend Developer

Philipp lead the Design Decisions for the Game, including his previous knowledge as a game developer to help limit the scope of the project.<br/>
He used the Havoc Physics Engine, BabylonJs, Raycasting and Math to create our own phyics system to allow a similar movement to that of the game [`Worms W.M.D.`](https://en.wikipedia.org/wiki/Worms_W.M.D).

# Project Management

The team held multiple meetings, discussing strategies and ideas on which modules should be implemented and their time requirements.<br/>
Work was distributed in meetings in theory, and then split up via Github Tickets with a Kanban Board.<br/>
Comunication was first done with Discord, while Slack was still having issues, until the team fully switched to using Slack.<br/>
Google Docs was used to work together on a shared vision for the game.<br/>
The team created Flowcharts with Miro for better understanding.<br/>

# Technical Stack

## Frontend

NextJs and React were used to create a Webpage, which was formatted with Tailwind CSS and Html.

## Backend

The backend traffick arrives through an Nginx container is redirected to a container running NestJs, which is then forwarded to the microservices.

## Database

Them team used PostgreSQL to set up Databases because of its ease of use, and its functionality of working together with ORMs like Prisma.

## Other tech

Websockets using Socket.io were used to enable fast comunication during the game.<br/>
The whole project was set up in a Docker Containers.<br/>
We use Redis to create a cache and create Sessions.<br/>

# Database Schema

?

# Feature List

## Wepage

Thang created a page which holds information about the project and team, as well as allowing access to the other features we have created.<br/>
Heading to localhost:8080 will serve you the page, which you can then maneuver.

## Accounts and user data

Mkhavari and Thang worked on creating a system to create user accounts for the page, which can keep track of a users data.<br/>
Head to the page and then click in the top right to sign in or sign up and make an account.
You can then head to the user page and view your account data.

## Game

Phillip and Lilly worked together on creating a game that can be played together on local multiplayer with different accounts.<br/>
Sign in to the page with multiple accounts, and press the button to start a game. Then get to the lobby with different tabs, change settings and ready up.

# Modules

## [2/2] Framework Frontend and Backend

We used NextJs as a framework for the backend and Nestjs as a framework for the frontend.<br/>
We chose this because we would need to have some framework anyways, so might as well get points for it.<br/>
Everybody worked on this.

## [2/2] Websockets

We use Sockets.io as a framework to create websockets which is used during the game to sync funcionality.<br/>
Websockets were an easy choice since we wanted to create a multiplayer game.<br/>
Stefan, Thang and Lilly did this.

## [2/2] User Interaction

There is a global chat, a profile page and a minimal friend system.<br/>
We wanted to track the game data on a page and this module overlapped with a lot of other stuff, which is why we chose it.<br/>
Stefan and Thang worked on this.

## [2/2] User Management

There is a profile page, which displays the users information, which includes an avatar and a list of your friends.<br/>
This was an easy module to do, because we had already made accounts for different.<br/>
Stefan and Thang worked on this.

## [?/1] Game Statistics

There exists a mock data for a match history, however it is not filled with data.<br/>
Acheivements exist and are tracked.<br/>
This was good module to choose that overlaps with databases.<br/>
Philipp and Mohamad worked on this.

## [1/1] ORM

We use Prisma as an ORM for our Databases.<br/>
We chose this because some of us like databases.<br/>
Mohamad worked on this.

## [1/1] Remote Auth

We use Googles OAuth 2.0 to allow the signing in with your Google Account into the webpage.<br/>
This was a cool module, so we chose it, and it made developing easier.<br/>
Stefan did this.

## [2/2] Advanced Permission System

There exists an admin panel which can be used only be the admin to manage some users.<br/>
This overlapped with the usesrs, so we chose this module.<br/>
Stefan did this.

## [2/2] Web-based Game

We have a Web-based Game that is real time multiplayer
with with a clear win/loss condition and in 3D.<br/>
We had 2 people who wanted to do this module, sow we chose it.<br/>
Lilly and Philipp did this.

## [2/2] Multiplyer Game

Up to 4 people can play a game synchronized together.<br/>
This was an interesting challenge, so we chose it.<br/>
Lilly and Philipp did this.

## [2/2] 3D Graphics

The game was created in BabylonJs with smooth interaction and a 2d game in 3d space.<br/>
Seemed like an easy module, since we had to use a framework anyways, so why not a 3D one.<br/>
Lilly and Philipp did this.

## [2/2] Monitoring

We have Grafana set up to check the different Containers health.<br/>
This was an easy choice because it helped with development.<br/>
Stefan did this.

## [1/1] Gamification

There exists an acheivemnent system which rewards you with a badge on your profile page.<br/>
Seemed like an easy choice for the game.<br/>
Thang, Philipp and Mohamad did this.

## [1/1] Customization

There exists the option to choose different maps and have a different setting for a different amount of worms per player.<br/>
Quick choice for free points because oru game already supported this stuff.<br/>
Thang and Lilly did this.

## [2/2] Microservice

All the different services are set up in their own containers with docker.<br/>
We were gonna do the whole system like this anyways, so might as well get the module for it.<br/>
Everyone did this.

# Individual Contributions

For more info read the modules section

# Lilly

Worked on the game and page fullstack.

- Framework Frontend and Backend
- Websockets
- Web-based Game
- Multiplayer Game
- 3D Graphics
- Customization
- Microservices

# Phillip

Worked on the acheivements and game

- Framework Frontend and Backend
- Game statistics
- Web-based Game
- Multiplayer Game
- 3D Graphics
- Gamification
- Microservices

# Thang

Worked on the webpage, acheivements and users

- Framework Frontend and Backend
- Websockets
- User interaction
- User management
- Customization
- Gamefication
- Microservices

# Mohamad

Worked on the game statistics and acheivements

- Framework Frontend and Backend
- Game Statistics
- ORM
- Gamefication
- Microservices

# Stefan

Set up basically everything

- Framework Frontend and Backend
- Websockets
- User interaction
- User management
- Remot Auth
- Advanced Permission System
- Monitoring
- Microservices
