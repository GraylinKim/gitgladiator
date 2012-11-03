var stats = ['age', 'stars', 'forks', 'commits', 'repositories', 'gists'], users = [];
$(document).ready(function() {
    $('#submit').click(visualize);
});

function visualize(e) {
    var $this = $(this);
    var $graphsContainer = $('.graphs-container');
    var form = document.forms[0],
        promises = [];

    var fail = false;

    users.push($(form['user_1']).val());
    users.push($(form['user_2']).val());
    for(var i = 0; i < users.length; i++) {
        var r = false;
        if(users[i] == "") {
            users = [];
            $('#submit').text('WIMP!');
            return false;
        }
        promises.push($.Deferred(function(def) {
            $.ajax({
                url: GITHUB + 'users/' + users[i] + IDENTITY + '&callback=?',
                success: function(data) {
                    console.log(data.meta);
                    if (data.data && data.data.message == "Not Found") {
                        console.log('test')
                        fail = true;
                    }
                    def.resolve();
                },
                dataType: 'jsonp'
            });
        }));
    }

    $.when.apply(null, promises).done(function () {
        if(fail) {
            users = [];
            $('#submit').text('WIMP!');
            return false;
        } else {
            promises = [];
            $this.unbind('click');
            $this.css('cursor', 'default');

            var $fight = $('#submit');
            results = [{}, {}];
            $fight.text('Loading...');
            $fight.fadeOut(1000).fadeIn(1000);
            var interval = setInterval(function() {
                $fight.fadeOut(1000).fadeIn(1000);
            }, 1000);

            for(var i = 0; i < users.length; i++) {
                promises.push(
                    $.Deferred(
                        function(def) {
                            getUserData(users[i], results[i], def);
                        }
                    )
                );
            };

            $.when.apply(null, promises).done(setupGraphs);

            function setupGraphs() {
                var saver = {};
                var totals = {
                    u1: 0,
                    u2: 0
                };
                var graphs = [];
                stats.forEach(function (s) {
                    var g = setupGraph(s, saver, totals);
                    graphs.push(g.hide());
                });
                
                setupWinner(totals);
                if (totals.u1 > totals.u2) {
                    $('.winner-container h').text(users[0] + ' wins!');
                } else {
                    $('.winner-container h1').text(users[1] + ' wins!');
                }

                displayGraphs(form, graphs, interval);
            }

            function setupGraph(name, saver, totals) {
                var graph = graphTemplate.clone();
                var r = dataFormatter(results[0], results[1], name, totals);
                saver[name] = r;
                r = normalize(r);
                graph.find('.label').text(formattedNames[name]);
                graph.find('.graph_1 h3').text(r.user1.actual);
                graph.find('.graph_2 h3').text(r.user2.actual);
                graph.find('.graph_1').css('width', r.user1.percent + '%');
                graph.find('.graph_2').css('width', r.user2.percent + '%');
                return graph;
            }

            function displayGraphs(form, graphs, interval) {
                clearInterval(interval);
                $(form).hide(function() {
                    var $graphsContainer = $('.graphs-container')
                    $graphsContainer.show();
                    countUp($('.result_1 h2'));
                    countUp($('.result_2 h2'));
                    $('.winner-container').fadeIn(2000, function() {
                        graphs.forEach(function(g) {
                            $graphsContainer.append(g);
                            g.slideDown(1000);
                        });
                        $('.retry-container').slideDown();
                        $('.retry-container').click(reset);
                    });
                });
            }

            function countUp(el) {
                var id = setInterval(numberCounter, 50);
                var time = 0;
                var number = parseFloat(el.data('total'));
                function numberCounter() {
                    position = time / 1500;
                        if (time == 1500) {
                            clearInterval(id);
                        }
                    el.text((position * number).toFixed(2));
                    time += 50;
                }
            }

            function setupWinner(totals) {
                $('.result_1 h3').text(users[0]);
                $('.result_2 h3').text(users[1]);
                $('.result_1 h2').text(0);
                $('.result_2 h2').text(0);
                $('.result_1 h2').data('total', totals.u1.toFixed(2));
                $('.result_2 h2').data('total', totals.u2.toFixed(2));
                var twitter;
                if(totals.u2 > totals.u1) {
                    $('.result_1 h3, .result_1 h2').css('font-weight', 'normal');
                    $('.result_2 h3, .result_2 h2').css({
                        'color': 'rgb(250, 195, 0)'
                    });
                    twitter = twitterTemplate(users[1], users[0]);
                } else {
                    $('.result_2 h3, .result_2 h2').css({
                        'font-weight': 'normal',
                    });
                    $('.result_1 h3, .result_1 h2').css({
                        'color': 'rgb(250, 195, 0)'
                    });
                    twitter = twitterTemplate(users[0], users[1]);
                }
                console.log(twitter);
                $('.retry-container').prepend(twitter);
                twttr.widgets.load();
            }
        }
    });
    
}

var graphTemplate = $("<div class='graph-container'> \
                        <div class='twelve columns'> \
                            <h3 class='label'>Commits</h3> \
                        </div> \
                        <div class='twelve columns'> \
                            <div class='graph_1 graph'><h3>63</h3></div> \
                            <div class='graph_2 graph'><h3>20</h3></div> \
                        </div> \
                    </div>");

function twitterTemplate(w, l)  {
    return $("<div class='twitter'> \
                            <a href='https://twitter.com/share' \
                             data-text='" + w +" just beat " + l + " on GitBattle. Battle now to see if you can beat either of them!'\
                             class='twitter-share-button' data-lang='en' data-url='http://gitbattle.com' data-size='medium' data-count='vertical'>Tweet</a> \
                        <h5>about your victory (or loss)</h5> \
                        </div>");
} 


var formattedNames = {
    'age': 'Age',
    'forks': 'Forks/repo',
    'stars': 'Stars/repo',
    'commits': 'Commits/day',
    'repositories': 'Repos',
    'gists': 'Gists'
}

function reset() {
    $('.graphs-container').empty().hide();
    $('.retry-container').hide();
    $('#submit').text('FIGHT');
    $('#submit').click(visualize);
    $('.user1 input').val('');
    $('.user2 input').val('');
    $(document.forms[0]).show();
    $('.winner-container').hide();
    $('.retry-container twitter').remove();
    users = [];
}

function normalize(r) {
    if(r.user1.percent < 10) {
        r.user1.percent = 15;
        r.user2.percent = 84;
    } else if (r.user2.percent < 10) {
        r.user2.percent = 15;
        r.user1.percent = 84;
    } else if (r.user2.percent + r.user1.percent === 100) {
        r.user1.percent -= 1;
    }
    return r;
}

function dataFormatter(user1, user2, stat, totals) {
    if(stat == 'age') {
        var init_date_1 = Date.parse(user1.age),
            init_date_2 = Date.parse(user2.age),
            today = Date.parse(new Date());
        var diff1 = Math.floor(((today - init_date_1) / 86400000)),
            diff2 = Math.floor(((today - init_date_2) / 86400000));
        var dp1 = Math.floor(diff1 / (diff1 + diff2) * 100),
            dp2 = Math.floor(diff2 / (diff1 + diff2) * 100);
        totals.u1 += dp1 * .1;
        totals.u2 += dp2 *.1;
        return {
            user1: {
                "actual" : diff1,
                "percent" : dp1
            },
            user2: {
                "actual" : diff2,
                "percent": dp2
            }
        }
    } else if (stat == 'forks' || stat == 'stars') {
        var ratio1 = Math.round((user1[stat] / user1.repositories * 10)) / 10,
            ratio2 = Math.round((user2[stat] / user2.repositories * 10)) / 10;

        var dp1 = Math.floor((ratio1 / (ratio1 + ratio2)) * 100),
            dp2 = Math.floor((ratio2 / (ratio1 + ratio2)) * 100);   


        totals.u1 += dp1 * .15;
        totals.u2 += dp2 *.15;
        return {
            user1: {
                "actual" : ratio1,
                "percent" : dp1
            },
            user2: {
                "actual" : ratio2,
                "percent": dp2
            }
        }; 
    } else if (stat == 'commits') {
            var init_date_1 = Date.parse(user1.age),
            init_date_2 = Date.parse(user2.age),
            today = Date.parse(new Date());
            var diff1 = Math.floor(((today - init_date_1) / 86400000)),
                diff2 = Math.floor(((today - init_date_2) / 86400000)); 
            if (diff1 !== 0 && user1.commits !== 0) {
                var ratio1 = Math.floor((user1.commits / diff1 * 10)) / 10;
            } else {
                var ratio1 = 0;
            }

            if (diff2 !== 0 && user2.commits !== 0) {
                var ratio2 = Math.floor((user2.commits / diff2 * 10)) / 10;
            } else {
                var ratio2 = 0;
            }

            if (ratio1 + ratio2 === 0) {
                var dp1 = 50,
                    dp2 = 50;
            } else {
                var dp1 = Math.floor((ratio1 / (ratio1 + ratio2)) * 100),
                    dp2 = Math.floor((ratio2 / (ratio1 + ratio2)) * 100);   
            }


            totals.u1 += dp1 * .45;
            totals.u2 += dp2 *.45;
            return {
                user1: {
                    "actual" : ratio1,
                    "percent" : dp1
                },
                user2: {
                    "actual" : ratio2,
                    "percent": dp2
                }
            };
    } else if (stat === 'gists' || stat === 'repositories') {
        var total = (user1[stat] + user2[stat]);
        if (total === 0) {
            var dp1 = 50, 
                dp2 = 50;
        } else {
            var dp1 = Math.floor(user1[stat] / total * 100);
            var dp2 = Math.floor(user2[stat] / total * 100);
        }
        if(stat == 'gists') {
            totals.u1 += dp1 * .05;
            totals.u2 += dp2 *.05;
        } else {
            totals.u1 += dp1 * .1;
            totals.u2 += dp2 *.1;
        }
        return {
            user1: {
                'actual': user1[stat],
                'percent': dp1
            },
            user2: {
                'actual': user2[stat],
                'percent': dp2
            }
        }
    }
}
