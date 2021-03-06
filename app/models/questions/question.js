﻿define(['eventManager', 'guard', 'eventDataBuilders/questionEventDataBuilder', 'plugins/http'],
    function (eventManager, guard, eventDataBuilder, http) {
        "use strict";

        function Question(spec) {
            if (typeof spec == typeof undefined) {
                throw 'You should provide a specification to create an Question';
            }

            this.id = spec.id;
            this.objectiveId = spec.objectiveId;
            this.title = spec.title;
            this.hasContent = spec.hasContent;
            this.type = spec.type;
            this.score = ko.observable(spec.score);
            this.learningContents = spec.learningContents;
            this.isAnswered = false;
            this.isCorrectAnswered = false;

            this.feedback = {
                hasCorrect: spec.hasCorrectFeedback,
                correct: null,

                hasIncorrect: spec.hasIncorrectFeedback,
                incorrect: null
            };
            this.loadFeedback = loadFeedback,

            this.content = null;
            this.loadContent = loadContent;
            this.loadLearningContent = loadLearningContent;
            this.load = load;

            this.learningContentExperienced = learningContentExperienced;
        }

        return Question;

        function learningContentExperienced(spentTime) {
            eventManager.learningContentExperienced(
                eventDataBuilder.buildLearningContentExperiencedEventData(this, spentTime)
            );
        }

        function loadContent() {
            var that = this;
            return Q.fcall(function () {
                if (!that.hasContent || !_.isNullOrUndefined(that.content)) {
                    return;
                }

                var contentUrl = 'content/' + that.objectiveId + '/' + that.id + '/content.html';
                return http.get(contentUrl)
                    .then(function (response) {
                        that.content = response;
                    })
                    .fail(function () {
                        that.content = '';
                    });
            });
        }

        function loadLearningContent() {
            var that = this;
            var requests = [];
            _.each(that.learningContents, function (item) {
                if (_.isNullOrUndefined(item.content)) {
                    requests.push(http.get('content/' + that.objectiveId + '/' + that.id + '/' + item.id + '.html')
                        .then(function (response) {
                            item.content = response;
                        }));
                }
            });

            return Q.allSettled(requests);
        }

        function load() {
            var that = this;
            return that.loadContent().then(function () {
                return that.loadLearningContent().then(function () {
                    return that.loadFeedback();
                });
            });
        }

        function loadFeedback() {
            var
                that = this,
                requests = [],
                feedbackUrlPath = 'content/' + that.objectiveId + '/' + that.id + '/',
                correctFeedbackContentUrl = feedbackUrlPath + 'correctFeedback.html',
                incorrectFeedbackContentUrl = feedbackUrlPath + 'incorrectFeedback.html';

            if (that.feedback.hasCorrect) {
                requests.push(http.get(correctFeedbackContentUrl).then(function (content) {
                    that.feedback.correct = content;
                }));
            }
            if (that.feedback.hasIncorrect) {
                requests.push(http.get(incorrectFeedbackContentUrl).then(function (content) {
                    that.feedback.incorrect = content;
                }));
            }

            return Q.allSettled(requests);
        }

    });