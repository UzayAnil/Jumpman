function level() {
    this.current = 0;
    this.levels = [
        [
            [100, 550, 50, 50],
            [200, 350, 50, 50],
            [0, 450, 50, 50]
        ],
        [
            [200, 450, 50, 50],
            [300, 350, 50, 50],
            [400, 250, 50, 50],
        ],
        [
            [100, 450, 50, 50],
            [100, 350, 50, 50],
            [300, 350, 50, 50],
            [400, 250, 50, 50],
            [300, 150, 50, 50],
        ]
    ];

    this.next = function() {
        if(this.current >= this.levels.length) this.current = 0;
        var level = this.levels[this.current];
        this.current++;

        return level;
    };
}
