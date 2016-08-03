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
        charactersDom.each(function (i, characterDom) {
            var $characterDom = $(characterDom);
            var profileUrl = $characterDom.find(".Author-avatar").attr("href");
            var matches = profileUrl.match(/http\:\/\/eu.battle.net\/wow\/.*?\/character\/(.*?)\/(.*?)\//);
            var character = {realm: matches[1], name: matches[2]};
            if (!myCharacters[character.realm]) {
                myCharacters[character.realm] = [];
            }
            myCharacters[character.realm].push(character.name)
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
        $postDom.find(".customAvatar").on("load", function () {
            $(this).siblings("img:not(.customAvatar)").hide();
        })
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
});
