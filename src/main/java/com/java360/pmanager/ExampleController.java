package com.java360.pmanager;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ExampleController {

    @GetMapping("/ok")
    public ResponseEntity<String> sayOK() {
        return ResponseEntity.ok("Everything OK!");
    }

    @PostMapping("/echo")
    public  ResponseEntity<String> echo(@RequestBody String value){
        StringBuilder sb = new StringBuilder(value);
        return ResponseEntity.ok(sb.reverse().toString());
    }
}
