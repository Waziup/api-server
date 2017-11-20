(function() {

    // Support Node and browser with selective export to modules or window
    var User = (function() {

        /**
         * Constructor
         * @param k keycloak user
         * @constructor
         */
        function User(k) {
            this.id = k.id;
            this.createdTime = k.createdTimestamp;
            this.username = k.username;
            this.firstName = k.firstName;
            this.lastName = k.lastName;
            this.email = k.email;
            this.subservice = "";
            this.phone = "";
            this.address = "";
            this.facebook = "";
            this.twitter = "";
            if (!k.attributes) k.attributes = {};
            this.subservice = k.attributes.subservice || "";
            this.phone = k.attributes.phone || "";
            this.address = k.attributes.address || "";
            this.facebook = k.attributes.facebook || "";
            this.twitter = k.attributes.twitter || "";
            //this.roles = null;
        };
        /**
         * Constructor
         * @constructor
         */
        //function User() {};
        /**
         * Get a new User instance from a keycloak representation
         * @param o
         * @returns {User}
         */
        User.fromObject = function(o) {
            return new User(k);
        };

        /**
         * Get a keycloak representation of this User instance
         * @returns {object}
         */
        User.prototype.toObject = function() {

            return JSON.parse(JSON.stringify(this));
        };

        /**
         * Is this User instance's email field valid?
         * @returns {boolean}
         */
        User.prototype.emailIsValid = function() {
            var valid = false;
            try {
                valid = (
                    typeof this.email !== 'undefined' && this.email !== null &&
                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.email)
                );
            } catch (e) {}
            return valid;
        };

        return User;

    })();

    // Export
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = User;
    } else {
        window.User = User;
    }

})();