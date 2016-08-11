$(document).ready(function ($) {
    var currentTopic = {};
    var me = {};
    allAboutMe();
    loadFirstPageForParsing();

    function topicManip() {
        currentTopic.topicData = $(".Topic").data('topic');
    }
    function pageManip() {
        currentTopic.posts = $('.TopicPost');
    }
    function allAboutMe() {
        var myCharacters = {};
        var charactersDom = $('.CharacterSelect-modal .Characters .Author');
        $('body').append("<script id='popupTemplate' type='text/template' ></script>");
        $('#popupTemplate').load(chrome.extension.getURL('popup_template.html'));
        charactersDom.each(function (i, characterDom) {
            var $characterDom = $(characterDom);
            var profileUrl = $characterDom.find(".Author-avatar").attr("href");
            var matches = profileUrl.match(/http\:\/\/eu.battle.net\/wow\/.*?\/character\/(.*?)\/(.*?)\//);
            var character = {realm: matches[1], name: matches[2]};
            if (!myCharacters[character.realm]) {
                myCharacters[character.realm] = [];
            }
            myCharacters[character.realm].push(character.name);
        })
        me.myCharacters = myCharacters;
    }
    function topicPostManip(postIterator, postDom) {
        var $postDom = $(postDom);
        var postData = $postDom.data('topicPost');
        var profileUrl = $postDom.find(".Author > a").attr("href");
        var matches = profileUrl.match(/http\:\/\/eu.battle.net\/wow\/.*?\/character\/(.*?)\/(.*?)\//);
        var character = {realm: matches[1], name: matches[2]};
        if (me.myCharacters && me.myCharacters[character.realm] && me.myCharacters[character.realm].indexOf(character.name) !== -1) {
            $postDom.addClass("myPost");
        }
        if (postData.author.id === currentTopic.topicOpId) {
            $postDom.addClass("opPost");
        }
        $postDom.find('.Author-avatar').append('<img class="customAvatar" src="http://wow.saelora.com/avatars/' + postData.author.id + '.png" />')
        $postDom.find(".customAvatar").on("error", function () {
            $(this).hide();
        });
        getTrpProfile(postData.author.id, $postDom)
    }
    function loadFirstPageForParsing() {
        var params = getLocationQueryParams();
        if (!params.page || (params.page && params.page !== "1")) {
            $('body').append("<div id='FirstPage' style='display: none;' />");
            var target = window.location.origin + window.location.pathname + "?page=1 .Topic"
            $('#FirstPage').load(target, function () {

                currentTopic.topicOpId = $("#post-1").data('topicPost').author.id;
                pageManip();
                topicManip();
                currentTopic.posts.each(topicPostManip);
            });

        } else {
            //assume first page is loaded
            currentTopic.topicOpId = $("#post-1").data('topicPost').author.id;

            pageManip();
            topicManip();
            currentTopic.posts.each(topicPostManip);
        }
    }
    function getLocationQueryParams() {
        var query = window.location.search.substring(1),
            vars = query.split('&'),
            i,
            pair,
            resultantObject = {};
        for (i = 0; i < vars.length; i += 1) {
            pair = vars[i].split('=');
            resultantObject[pair[0]] = pair[1]
        }
        return resultantObject;
    }
    function getTrpProfile(id, postDom) {
        $.get('http://wow.saelora.com/profiles/' + id + '.json', function (data) {
            if (data.error){
                //do nothing
            } else {
                data.id = id;
                insertProfile(data, postDom);
            }
        }, "json");
    }
    function insertProfile(character, $postDom) {
        if (character.player.characteristics.LN) {
            var oldname = $postDom.find('.Author .Author-name a').text()
            if (character.player.characteristics.FN || character.player.characteristics.LN) {
                $postDom.find('.Author-name > a').html((character.player.characteristics.TI ? (character.player.characteristics.TI + " ") : "") +
                    (character.player.characteristics.FN ? (character.player.characteristics.FN + " ") : "") +
                    (character.player.characteristics.LN ? character.player.characteristics.LN : "") +
                    " <span class='oldName'>(" + oldname + ")</span>");
            }
            var newClass;
            if (character.player.characteristics.RA && character.player.characteristics.CL) {
                var oldClass = $postDom.find(".Author-class").text();
                var level = oldClass.split(" ")[0];
                newClass = level + " " + character.player.characteristics.RA +
                    " " + character.player.characteristics.CL;
            } else if (character.player.characteristics.RA) {
                var oldClass = $postDom.find(".Author-class").text();
                var oldparams = oldClass.split(" ");
                var level = oldparams[0];
                newClass = level + " " + character.player.characteristics.RA +
                    " "
                    + ((oldparams[2] === "Elf") ? oldparams[3] + " " + (oldparams[4] ? oldparams[4] + " " : "") : oldparams[2] + (oldparams[3] ? " " + oldparams[3] : ""));
            } else if (character.player.characteristics.CL) {
                var oldClass = $postDom.find(".Author-class").text();
                var oldparams = oldClass.split(" ");
                var level = oldparams[0];
                newClass = level + " " + ((oldparams[2] === "Elf") ? oldparams[1] + " " + oldparams[2] : oldparams[1]) +
                    " "
                    + character.player.characteristics.CL;
            } else {
                newClass = $postDom.find(".Author-class").text();
            }
            $postDom.find(".Author-class").text(newClass);
            var isICGuild = (character.player.misc.ST[6] === 1);
            if (isICGuild) {
                $postDom.addClass("icGuild");
            }
            $postDom.find(".Author-class").css("color", "#" + character.player.characteristics.CH);
            $postDom.find(".Author-avatar").after("<div class='profileButton'/>");
            $postDom.find(".profileButton").text("Profile");
            $postDom.find(".profileButton").click(function () {
                var content = $('#popupTemplate').html();
                content = content.replace(/&lt;/gi, "<");
                content = content.replace(/&gt;/gi, ">");
                content = content.replace(/&amp;/gi, "&");
                var contentTemplate = _.template(content);
                var contentCompiled = contentTemplate({character: character, $postDom: $postDom, isICGuild: isICGuild, formatAbout: formatAbout, newClass: newClass});
                var $content = $(contentCompiled);
                $content.find('.characterClass').css("color", "#" + character.player.characteristics.CH);
                $("body").append($content);
                $(".closeBlind, .profileClose").on("click", function () {
                    $content.remove();
                });
                $(".closeBlind .profilePopup").click(function (e) {
                    e.stopPropagation();
                });

                $(".profileTabs .tab").on("click", function () {
                    $(".profileTabs .tab").removeClass('selected');
                    $(".tabBodies > div").removeClass('selected');
                    $(this).closest('.tab').addClass('selected');
                    $(".tabBodies > div." + $(this).data('target')).addClass('selected');
                });

            });
        }
    }
    function formatAbout(about) {
        about = about || "{h1:c}{col:362212}Sælora Sinanar'diel{/h1}\n\n{h2}{col:362212}Apperance{/h2}\n\n{h3}{col:362212}Face{/h3}\n{col:362212}If not for the apparent youthfulness of Sælora's features, her featurres could be described as creul, as it is the best description is 'sharp'.\nThose who try to look her in the eye may notice green irises behind the distracting blue glow of her eyes.{/col}\n\n{h3}{col:362212}Hair{/h3}\n{col:362212}Sælora sports the natural blonde hair of her kin, usually pulled back in a tight tail and clasped with varying clasps, changing day-to-day.\n\nWhen untied, usually in the evenings, her hair hangs loosely across her shoulders in long golden tresses, wavy, thanks to the amount of time she spends with it tied back in a tail.\n\n{h2}{col:362212}History{/h2}\n\n{col:362212}Known to some as Lady Starspell, and others as Sælora Sinanar'diel, but allowing most to call her Lora, Sælora is surprisingly enigmatic for someone who seems to say a lot about herself, without really telling anything.\n\nThose who dig into Sælora's past soon find a confusing net of contradictions and impossibilities, including a mixture of the truth, blatant lies and some more subtle deceptions.\n\nSome sources show Lora as a paladin, althogh few agree on what order, if any, she belongs to. Others list her as an unaffiliated mage, while most agree that she has strong mercenary proclivities, althogh those often disagree with one and another.\n\nThose who dig deeper in an attempt to find more about her past, will find that information grows thin prior to the first war, with a few references to a wandering magi that fits her description. Before that, the only mention of a Sælora Sinanar'diel are of the adopted heir of the Starspell family.\n\nThose who manage to track that far into Sælora's's history may notice a slight discrepancy, extremely unlikely to be found out, but the child Saelora sinanar'diel has a much rounder face than is likely ot have developed into Sælora's narrow features.\n\n\n\n\n\n\n\n\n";
        var replacements = {
            "<br />": /\n+?/gmi,
            "<span style='color: #$1'>$2</span>": /\{col:(\d{6})}([^{]*?)\{\/col}/gim,
            "<span style='color: #$1'>$2</span>$3": /\{col:(\d{6})}([^{]*?)(\{)/gim, //TODO: improve the shit out of this
            "<h$1>$2</h$1>": /\n?\{h(\d)}([^{]*?)(\{\/h\d})\n?/gim,
            "<h$1 class='centered'>$2</h$1>": /\n?\{h(\d):c}([^{]*?)(\{\/h\d})\n?/gim,
            "<span style='color: #$1'>$2</span> ": /\{col:(\d{6})}([^{]*?)$/gim
        };
        $.each(replacements, function (replace, match) {
            about = about.replace(match, replace);
        });
        return about;
    }
});
