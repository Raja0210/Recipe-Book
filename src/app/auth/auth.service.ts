import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, tap} from "rxjs/operators";
import {throwError} from "rxjs";
import {Subject} from "rxjs/Subject";
import {UserModel} from "./user.model";

export interface AuthResponseData{
  idToken:string;
  email:string;
  refreshToken:string;
  expiresIn:string;
  localId:string;
  registered?:boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user = new Subject<UserModel>();

  constructor(private http: HttpClient) { }

  signup(email:string, password:string) {
    return this.http.post<AuthResponseData>("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyD51zZUpsRW3V-wNlKlMHaUZ3-087X9YME",
      {
        email:email,
        password:password,
        returnSecureToken:true,
      }
    ).pipe(catchError(this.handleError),
      tap(
        resData => {
        this.handleAuthentication(
          resData.email,
          resData.localId,
          resData.idToken,
          +resData.expiresIn
        )
    }));
  }
  login(email:string, password:string) {
    return this.http.post<AuthResponseData>("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD51zZUpsRW3V-wNlKlMHaUZ3-087X9YME",
      {
        email:email,
        password:password,
        returnSecureToken:true,
      }
    ).pipe(catchError(this.handleError),
      tap(
      resData => {
        this.handleAuthentication(
          resData.email,
          resData.localId,
          resData.idToken,
          +resData.expiresIn
        )
      }));
  }

  private handleAuthentication(
    email:string,
    userId:string,
    token:string,
    expiresIn:number) {
      const expirationDate = new Date(
        new Date().getTime() + expiresIn*1000
      );
      const user = new UserModel(
        email,
        userId,
        token,
        expirationDate
      );
      this.user.next(user);
  }

  private handleError(error:HttpErrorResponse) {
      let errorMessage='An unknown error occured'
      if(!error.error || !error.error.error){
        return throwError(errorMessage);
      }
      switch (error.error.error.message){
        case 'EMAIL_EXISTS':
          errorMessage="This email exists already!";
          break;
        case 'EMAIL_NOT_FOUND':
          errorMessage="This email does not exist!";
          break;
        case 'INVALID_PASSWORD':
          errorMessage="This password is not correct!";
          break;
      }
      return throwError(errorMessage);
  }
}
