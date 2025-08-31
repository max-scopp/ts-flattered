import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Component, OnInit } from "@angular/core";

export class MyComponent {
    constructor(private http: HttpClient, private router: Router) {
        /* tscb:1 */ 
                // Constructor body
              
    }

    ngOnInit(): void {
        /* tscb:2 */ 
                console.log('Component initialized');
              
    }
}
