const Discord = require('discord.js');
const Util = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const ytdl = require('ytdl-core');
const gif = require('gif-search');
const nodeopus = require('node-opus');
const conv = require('number-to-words');
const ffmpeg = require('ffmpeg');
const PREFIX = process.env.PREFIX
const client = new Discord.Client({ disableEveryone: true});

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('')
  console.log('')
  console.log('╔[═════════════════════════════════════════════════════════════════]╗')
  console.log(`[Start] ${new Date()}`);
  console.log('╚[═════════════════════════════════════════════════════════════════]╝')
  console.log('')
  console.log('╔[════════════════════════════════════]╗');
  console.log(`Logged in as * [ " ${client.user.username} " ]`);
  console.log('')
  console.log('Informations :')
  console.log('')
  console.log(`servers! [ " ${client.guilds.size} " ]`);
  console.log(`Users! [ " ${client.users.size} " ]`);
  console.log(`channels! [ " ${client.channels.size} " ]`);
  console.log('╚[════════════════════════════════════]╝')
  console.log('')
  console.log('╔[════════════]╗')
  console.log(' Bot Is Online')
  console.log('╚[════════════]╝')
  console.log('')
  console.log('')
  console.log('Yo this ready!')
});

client.on('warn', console.warn);

client.on('error', console.error);

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

client.on('reconnecting', () => console.log('I am reconnecting now!'));

let cmds = {
	play: { cmd: 'play', a: ['p'] },
	stop: { cmd: 'stop', a: ['s'] },
	join: { cmd: 'join', a: ['j'] },
	volume: { cmd: 'volume', a: ['vol'] },
	queue: { cmd: 'queue', a: ['q'] },
	repeat: { cmd: 'repeat', a: ['re'] },
	skip: { cmd: 'skip' },
	skipto: { cmd: 'skipto', a: ['sto'] },
	pause: { cmd: 'pause' },
	resume: { cmd: 'resume' }
};

Object.keys(cmds).forEach(key => {
    	var value = cmds[key];
    	var command = value.cmd;
    	client.commands.set(command, command);
	if(value.a) {
		  value.a.forEach(alias => {
		  client.aliases.set(alias, command)
	})
}});

client.on('message', async msg => { 
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;

    const args = msg.content.split(' ');
    const args1 = msg.content.split(" ").slice(1);
    const text1 = args1.slice(0).join("");
    const args2 = msg.content.slice(PREFIX.length).trim().split(/ +/g);
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);
    const voiceChannel = msg.member.voiceChannel;
    const command = args2.shift().toLowerCase();

    var cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));

    if (cmd === 'play') {
	if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}play command in ${msg.guild.name}`);
        let args1 = msg.content.split(' ').slice(1);
        if (!voiceChannel) return msg.channel.send(":x:** You need to be in a voice channel**!");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT')) {
		return msg.channel.send(":no_entry_sign: **I am unable to connect **!");
        }
        if (!permissions.has('SPEAK')) {
		return msg.channel.send("**I can not speak in this room, please make sure that i have full perms for this**!");
        }
        if (text1 == "") {
		return msg.channel.send("**:x: Please specify a filename.**");
        }
        
		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
            return msg.channel.send(`:white_check_mark: \`\`${playlist.title}\`\` Added to **.A-Queue**!`);
        } else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					voiceChannel.join().then(connection => console.log('Connected!'));
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
                    const embed1 = new Discord.RichEmbed()
                    .setColor('BLACK')
                    .setAuthor(`.A-Music`, `https://goo.gl/jHxBTt`)
                    .setTitle(`**Song selection** :`)
                    .setDescription(`${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`);
                    msg.channel.sendEmbed(embed1).then(message =>{message.delete(15000)});	
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send(':information_source: **No song selected to play.**').then(message =>{message.delete(5000)});
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send(':x: **I don`t get any search result.**').then(message =>{message.delete(5000)});
				}
			}
			return handleVideo(video, msg, voiceChannel);
		} 
    } else if (cmd === 'stop') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}stop command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        if (!serverQueue) return msg.channel.send(":information_source: **There is nothing playing that I could stop for you.**").then(message =>{message.delete(5000)});
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return msg.channel.send('k :cry:');
    } else if (cmd === 'join') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}join command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        voiceChannel.join().then(connection => console.log('joind to voiceChannel!')).catch(error =>{
        console.error(`I could not join the voice channel: **${error}**`);
	return msg.channel.send(`I could not join the voice channel: **${error}**!`);
        });
        return msg.channel.send('**:white_check_mark: Joind.**');
    } else if (cmd === 'volume') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}volume command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        if (!serverQueue) return msg.channel.send(':information_source: **There is nothing playing.**').then(message =>{message.delete(5000)});
        if (!args[1]) return msg.channel.send(`:speaker: **Current volume is:** ${serverQueue.volume}`);
        if (parseInt(args2[0]) > 200) return msg.channel.send('**You can\'t set the volume more than `200`.**');
        serverQueue.volume = args2[0];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 150);
        return msg.channel.send(`:loud_sound: **Volume:** ${serverQueue.volume}`);
    } else if (cmd === 'queue') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}queue command in ${msg.guild.name}`);
        if (!serverQueue) return msg.channel.send(':information_source: **no_more_Queue.**').then(message =>{message.delete(5000)});
        let index = 0;
        let text = '';
        for (var i = 0; i < serverQueue.songs.length; i++) {
	let num;
	if((i) > 8) {
		let st = `${i+1}`
		console.log(st);
		let n1 = conv.toWords(st[0]);
		let n2 = conv.toWords(st[1]);
		num = `:${n1}::${n2}:`
        } else {
		let n = conv.toWords(i+1);
		num = `:${n}:`
        }
		text += `**[${++index}] -** ${serverQueue.songs[i].title} [\`\`${serverQueue.songs[i].duration}\`\`]\n`
        }
        const embedqu = new Discord.RichEmbed()
        .setColor('BLACK')
        .setAuthor(`.A-Queue`, `https://goo.gl/jHxBTt`)
        .setTitle("**.A-Queue List :**")
        .addField('__Now Playing__  :musical_note: ' , `**${serverQueue.songs[0].title}**`,true)
        .addField(':musical_score:  __UP NEXT__ :musical_score: ' , `${text}`)
	if (!serverQueue.songs || serverQueue.songs > 2) {
		embedqu.setFooter('#skipto [number]')
	} 
        return msg.channel.sendEmbed(embedqu);
    } else if(cmd === 'repeat') {
	if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}repeat,' command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        if (!serverQueue) return msg.channel.send(':information_source: **There is nothing playing that I could repeat for you.**').then(message =>{message.delete(5000)});
        if (serverQueue.repeating) {
		serverQueue.repeating = false;
		return msg.channel.send(':repeat: **.A-Repeating Mode** (`False`)');
        } else {
		serverQueue.repeating = true;
		return msg.channel.send(':repeat: **.A-Repeating Mode** (`True`)');
        }
    } else if (cmd === 'skip') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}skip command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        if (!serverQueue) return msg.channel.send(":information_source: **There is nothing playing that I could skip for you.**").then(message =>{message.delete(5000)});
        if(serverQueue.repeating) {
            serverQueue.repeating = false;
            serverQueue.connection.dispatcher.end('ForceSkipping..');
            serverQueue.repeating = true;
        } else {
            serverQueue.connection.dispatcher.end('Skip command has been used!');
        }
    } else if (cmd === 'skipto') {
        if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}skipto command in ${msg.guild.name}`);
        if (!msg.member.voiceChannel) return msg.channel.send(":x:**You are not in a voice channel**!").then(message =>{message.delete(5000)});
        if (!serverQueue) return msg.channel.send(":information_source: **There is nothing playing that I could skipto for you.**").then(message =>{message.delete(5000)});
        if(!serverQueue.songs || serverQueue.songs < 2) return msg.channel.send('There is no music to skip to.');
        if(serverQueue.repeating) return msg.channel.send(`**You can\'t skipto, because repeating mode is on, run \`\`${PREFIX}repeat\`\` to turn off.**`);
        if(!args2[0] || isNaN(args2[0])) return msg.channel.send('**Please input song number to skip to it, run `#queue` to see songs numbers.**');
        let sN = parseInt(args2[0]) - 1;
        if(!serverQueue.songs[sN]) return msg.channel.send('**There is no song with this number.**');
        let i = 1;
        while (i < sN) {
        i++;
        serverQueue.songs.shift();
        }
        serverQueue.connection.dispatcher.end('SkippingTo..');
        return undefined;  
    }  else if (cmd === 'pause') {
	if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
        console.log(`${msg.author.tag} has been used the ${PREFIX}pause command in ${msg.guild.name}`);
        if (serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return msg.channel.send('k :unamused:');
	}
        return msg.channel.send(':information_source: **There is nothing playing that I could pause for you.**').then(message =>{message.delete(5000)})
    } else if (cmd === 'resume') {
	if (!msg.member.hasPermission('MANAGE_MESSAGES')) return undefined;
	console.log(`${msg.author.tag} has been used the ${PREFIX}resume command in ${msg.guild.name}`);
	if (serverQueue && !serverQueue.playing) {
        serverQueue.playing =  true;
        serverQueue.connection.dispatcher.resume();
        return msg.channel.send('k :slight_smile:');
	}
	return msg.channel.send(':information_source: **There is nothing playing that I could resume for you.**').then(message =>{message.delete(5000)})
    }

    return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	const args2 = msg.content.slice(PREFIX.length).trim().split(/ +/g);


//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));

let hrs = video.duration.hours == 1 ? (video.duration.hours > 9 ? `${video.duration.hours}:` : `0${video.duration.hours}:`) : '';
let min = video.duration.minutes > 9 ? `${video.duration.minutes}:` : `0${video.duration.minutes}:`;
let sec = video.duration.seconds > 9 ? `${video.duration.seconds}` : `0${video.duration.seconds}`;
let dur = `${hrs}${min}${sec}`

	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		duration: dur,
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 100,
			playing: true,
        		repeating: false
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`I cant join this voice channel: **${error}**`);
		}
	} else {
		serverQueue.songs.push(song);
		if (playlist) return undefined;
		if(!args2) return msg.channel.send(':x: **I don`t get any search result.**');
        	else return msg.channel.send(`:white_check_mark: \`\`${song.title}\`\`[\`\`${song.duration}\`\`] Added to **.A-Queue**!`);
        }
        return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
        serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return serverQueue.textChannel.send(`:stop_button: **.A-Queue** finished!!`);
	}
	console.log(serverQueue.songs);
	
	if(serverQueue.repeating) {
		serverQueue.textChannel.send(`:white_check_mark: .A-Music Repeating **${song.title}**`);
	} else {
		serverQueue.textChannel.send(`:white_check_mark: .A-Music playing **${song.title}**`);
	}

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			if(serverQueue.repeating) return play(guild, serverQueue.songs[0])
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 150);


}

function embedFormat(queue) {

	if(!queue || !queue.songs) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(100);
        } else if(!queue.playing) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(queue.volume);
        } else {

          let progress = (queue.connection.dispatcher.time / queue.songs[0].msDur);
          let prog = bar(progress);
          let volIcon = volumeIcon(queue.volume);
          let playIcon = (queue.connection.dispatcher.paused ? "\u23F8" : "\u25B6")
          let dura = queue.songs[0].duration;

          return playIcon + ' ' + prog + ' `[' + formatTime(queue.connection.dispatcher.time) + '/' + dura + ']`' + volIcon;


        }

}

function formatTime(duration) {
	var milliseconds = parseInt((duration % 1000) / 100),
	seconds = parseInt((duration / 1000) % 60),
	minutes = parseInt((duration / (1000 * 60)) % 60),
	hours = parseInt((duration / (1000 * 60 * 60)) % 24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	return (hours > 0 ? hours + ":" : "") + minutes + ":" + seconds;
}

function bar(precent) {

	var str = '';

	for (var i = 0; i < 12; i++) {

          let pre = precent
          let res = pre * 12;

          res = parseInt(res)

          if(i == res){
            str+="\uD83D\uDD18";
          }
          else {
            str+="▬";
          }
        }

        return str;

}

function volumeIcon(volume) {

        if(volume == 0)
           return "\uD83D\uDD07";
       if(volume < 30)
           return "\uD83D\uDD08";
       if(volume < 70)
           return "\uD83D\uDD09";
       return "\uD83D\uDD0A";

}

client.login(process.env.BOT_TOKEN);
